import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth";
import { authorizeRoles } from "@/lib/server/rbac";

const prismaDb: any = db;
const MANUAL_CREATE_MODE = "admin-manual-job-create";
const MANUAL_UPDATE_MODE = "admin-manual-job-update";

function toUiStatus(rawStatus: string): string {
  const status = String(rawStatus || "pending").toLowerCase();
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  if (
    status === "accepted" ||
    status === "assigned" ||
    status === "in_progress" ||
    status === "in-progress"
  )
    return "Active";
  return "Pending";
}

function toProgress(rawStatus: string): number {
  const status = String(rawStatus || "pending").toLowerCase();
  if (status === "completed") return 100;
  if (
    status === "accepted" ||
    status === "assigned" ||
    status === "in_progress" ||
    status === "in-progress"
  )
    return 50;
  return 0;
}

function toRawStatus(value: string): string {
  const status = String(value || "pending")
    .trim()
    .toLowerCase();
  if (status === "completed") return "completed";
  if (status === "cancelled") return "cancelled";
  if (status === "active" || status === "assigned") return "accepted";
  if (status === "in-progress") return "in_progress";
  return "pending";
}

function parseJson(value: string | null): Record<string, unknown> {
  if (!value) return {};
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function isJobModelUnavailable(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return (
    message.includes("job") &&
    (message.includes("does not exist") ||
      message.includes("table") ||
      message.includes("p2021"))
  );
}

async function loadManualJobs() {
  const logs = await prismaDb.authLog.findMany({
    where: {
      provider: "system",
      mode: { in: [MANUAL_CREATE_MODE, MANUAL_UPDATE_MODE] },
      status: "SUCCESS",
    },
    orderBy: { createdAt: "asc" },
    select: {
      mode: true,
      response: true,
      createdAt: true,
    },
  });

  const jobs = new Map<string, any>();

  for (const row of logs) {
    const payload = parseJson(row.response);
    const jobId = String(payload.id || "");
    if (!jobId) continue;

    if (row.mode === MANUAL_CREATE_MODE) {
      jobs.set(jobId, {
        id: jobId,
        title: String(payload.title || "Untitled Job"),
        client: String(payload.client || "Manual Entry"),
        budget: Number(payload.price || 0),
        status: toUiStatus(String(payload.status || "pending")),
        progress: toProgress(String(payload.status || "pending")),
        deadline: new Date(
          String(payload.createdAt || row.createdAt),
        ).toLocaleDateString(),
        applicants: Number(payload.applicants || 0),
        assigned: String(payload.assigned || "Unassigned"),
        providerId: String(payload.providerId || ""),
        category: String(payload.category || "General"),
        description: String(payload.description || ""),
        location: String(payload.location || ""),
      });
      continue;
    }

    const existing = jobs.get(jobId);
    if (!existing) continue;

    const nextRawStatus = String(
      payload.status || existing.status || "pending",
    );
    const nextAssigned =
      payload.assigned !== undefined
        ? String(payload.assigned || "Unassigned")
        : existing.assigned;
    const nextProviderId =
      payload.providerId || payload.assignedId || existing.providerId || "";
    jobs.set(jobId, {
      ...existing,
      status: toUiStatus(nextRawStatus),
      progress: toProgress(nextRawStatus),
      assigned: nextAssigned,
      providerId: String(nextProviderId || ""),
    });
  }

  return Array.from(jobs.values()).reverse();
}

export async function GET(request: Request) {
  const denied = authorizeRoles(request, ["admin", "sub-admin", "subadmin"]);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let jobs: any[] = [];
    let usingManualJobsOnly = false;

    try {
      jobs = await prismaDb.job.findMany({
        where: {
          ...(status && status !== "All"
            ? { status: toRawStatus(status) }
            : {}),
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          price: true,
          location: true,
          postedById: true,
          providerId: true,
          serviceId: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      if (!isJobModelUnavailable(error)) {
        throw error;
      }
      usingManualJobsOnly = true;
    }

    if (usingManualJobsOnly) {
      const manualJobs = await loadManualJobs();
      const filtered =
        status && status !== "All"
          ? manualJobs.filter((job) => job.status === status)
          : manualJobs;
      return NextResponse.json({ ok: true, data: filtered });
    }

    const [users, services] = await Promise.all([
      prismaDb.user.findMany({
        where: {
          id: {
            in: Array.from(
              new Set(
                jobs.flatMap(
                  (job) =>
                    [job.postedById, job.providerId].filter(
                      Boolean,
                    ) as string[],
                ),
              ),
            ),
          },
        },
        select: { id: true, name: true, email: true },
      }),
      prismaDb.service.findMany({
        where: {
          id: {
            in: Array.from(
              new Set(
                jobs.map((job) => job.serviceId).filter(Boolean) as string[],
              ),
            ),
          },
        },
        select: { id: true, name: true, category: true },
      }),
    ]);

    const userMap = new Map(users.map((user) => [user.id, user]));
    const serviceMap = new Map(
      services.map((service) => [service.id, service]),
    );

    // Map database fields to UI fields
    const formattedJobs = jobs.map((job) => ({
      id: job.id,
      title: job.title,
      client: userMap.get(job.postedById)?.name || "Unknown Poster",
      budget: job.price,
      status: toUiStatus(job.status),
      progress: toProgress(job.status),
      deadline: new Date(job.createdAt).toLocaleDateString(),
      applicants: job.providerId ? 1 : 0,
      assigned: userMap.get(job.providerId || "")?.name || "Unassigned",
      category: serviceMap.get(job.serviceId || "")?.category || "General",
      description: job.description,
      location: job.location || "",
    }));

    const manualJobs = await loadManualJobs();
    const merged = [...manualJobs, ...formattedJobs];
    const filtered =
      status && status !== "All"
        ? merged.filter((job) => job.status === status)
        : merged;

    return NextResponse.json({ ok: true, data: filtered });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch jobs";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { actor, error } = await getSessionActor(request);
  if (error) return error;

  if (!actor || !hasAnyRole(actor, ["admin"])) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const title = String(body?.title || "").trim();
    const description = String(body?.description || "").trim();
    const price = Number(String(body?.price ?? "").replace(/,/g, ""));
    const location = String(body?.location || "").trim();
    const providerId = String(body?.providerId || "").trim() || null;
    const serviceId = String(body?.serviceId || "").trim() || null;

    if (!title || !description || !Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { ok: false, error: "title, description and price are required" },
        { status: 400 },
      );
    }

    if (providerId) {
      const verifiedProvider = await db.verification.findFirst({
        where: {
          userId: providerId,
          status: "approved",
        },
        select: { id: true },
      });

      if (!verifiedProvider) {
        return NextResponse.json(
          { ok: false, error: "Provider must be verified before assignment" },
          { status: 400 },
        );
      }
    }

    try {
      const job = await prismaDb.job.create({
        data: {
          title,
          description,
          price: Math.round(price),
          currency: "KES",
          location: location || null,
          postedById: actor.id,
          providerId: providerId || undefined,
          serviceId: serviceId || undefined,
          status: "pending",
        },
      });

      return NextResponse.json({ ok: true, data: job });
    } catch (error) {
      if (!isJobModelUnavailable(error)) {
        throw error;
      }

      const manualId = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const assignedUser = providerId
        ? await prismaDb.user.findUnique({
            where: { id: providerId },
            select: { name: true },
          })
        : null;

      await prismaDb.authLog.create({
        data: {
          provider: "system",
          mode: MANUAL_CREATE_MODE,
          email: actor.email,
          status: "SUCCESS",
          response: JSON.stringify({
            id: manualId,
            title,
            description,
            price: Math.round(price),
            location,
            status: "pending",
            createdAt: new Date().toISOString(),
            client: actor.name || actor.email || "Admin",
            assigned: assignedUser?.name || "Unassigned",
            providerId: providerId || undefined,
            category: "General",
            applicants: providerId ? 1 : 0,
          }),
        },
      });

      return NextResponse.json({
        ok: true,
        data: {
          id: manualId,
          status: "pending",
        },
      });
    }
  } catch (error) {
    console.error("Failed to create admin job", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to create job",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const denied = authorizeRoles(request, ["admin"]);
  if (denied) return denied;

  const { actor } = await getSessionActor(request);

  try {
    const body = await request.json();
    const { id, status, providerId, title, client, budget, description } = body;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "id is required" },
        { status: 400 },
      );
    }

    const nextStatus = String(status || "")
      .trim()
      .toLowerCase();
    const data: Record<string, unknown> = {};

    if (nextStatus) {
      data.status = nextStatus;
    }

    if (typeof providerId === "string" && providerId.trim()) {
      const verifiedProvider = await db.verification.findFirst({
        where: { userId: providerId.trim(), status: "approved" },
        select: { id: true },
      });

      if (!verifiedProvider) {
        return NextResponse.json(
          { ok: false, error: "Provider must be verified before assignment" },
          { status: 400 },
        );
      }

      data.providerId = providerId.trim();
    }

    // Handle edit fields
    if (typeof title === "string") {
      data.title = title.trim();
    }
    if (typeof client === "string") {
      data.client = client.trim();
    }
    if (typeof description === "string") {
      data.description = description.trim();
    }
    if (typeof budget === "number" && budget > 0) {
      data.budget = budget;
    }

    const manualStatus = data.status ? String(data.status) : "";

    if (id.startsWith("manual-")) {
      await prismaDb.authLog.create({
        data: {
          provider: "system",
          mode: MANUAL_UPDATE_MODE,
          email: actor?.email,
          status: "SUCCESS",
          response: JSON.stringify({
            id,
            title: data.title,
            client: data.client,
            description: data.description,
            budget: data.budget,
            status: manualStatus,
            providerId: data.providerId || undefined,
          }),
        },
      });

      return NextResponse.json({ ok: true, data: { id, ...data } });
    }

    let updated: any;
    try {
      updated = await prismaDb.job.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (!isJobModelUnavailable(error)) {
        throw error;
      }

      await prismaDb.authLog.create({
        data: {
          provider: "system",
          mode: MANUAL_UPDATE_MODE,
          email: actor?.email,
          status: "SUCCESS",
          response: JSON.stringify({
            id,
            title: data.title,
            client: data.client,
            description: data.description,
            budget: data.budget,
            status: manualStatus,
            providerId: data.providerId || undefined,
          }),
        },
      });

      updated = { id, ...data };
    }

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "Failed to update job" },
      { status: 500 },
    );
  }
}
