import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth";

const prismaDb: any = db;
const MANUAL_CREATE_MODE = "admin-manual-job-create";
const MANUAL_UPDATE_MODE = "admin-manual-job-update";

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
      const providerId = String(payload.providerId || "");
      jobs.set(jobId, {
        id: jobId,
        title: String(payload.title || "Untitled Job"),
        description: String(payload.description || ""),
        status: String(payload.status || "pending").toLowerCase(),
        price: Number(payload.price || 0),
        currency: "KES",
        location: String(payload.location || ""),
        createdAt: new Date(String(payload.createdAt || row.createdAt)),
        postedBy: {
          name: String(payload.client || "Admin"),
          role: "admin",
        },
        providerId,
        provider: providerId
          ? {
              id: providerId,
              name: String(payload.assigned || "Assigned Provider"),
            }
          : null,
        service: null,
      });
      continue;
    }

    const existing = jobs.get(jobId);
    if (!existing) continue;

    const nextProviderId =
      payload.providerId || payload.assignedId || existing.providerId || "";
    const nextAssignedName =
      payload.assigned !== undefined
        ? String(payload.assigned || existing.provider?.name || "Provider")
        : existing.provider?.name;

    jobs.set(jobId, {
      ...existing,
      status: String(
        payload.status || existing.status || "pending",
      ).toLowerCase(),
      providerId: String(nextProviderId || ""),
      provider:
        nextProviderId || nextAssignedName
          ? {
              id: String(nextProviderId || existing.provider?.id || ""),
              name: nextAssignedName || existing.provider?.name || "Provider",
            }
          : null,
    });
  }

  return Array.from(jobs.values());
}

export async function GET() {
  let jobs: any[] = [];
  let usingManualJobsOnly = false;

  try {
    jobs = await db.job.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        postedBy: { select: { id: true, name: true, email: true, role: true } },
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            basePrice: true,
            image: true,
          },
        },
      },
    });
  } catch (error) {
    if (!isJobModelUnavailable(error)) {
      throw error;
    }
    usingManualJobsOnly = true;
  }

  const manualJobs = await loadManualJobs();
  const merged = usingManualJobsOnly ? manualJobs : [...manualJobs, ...jobs];
  merged.sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime(),
  );

  return NextResponse.json({ ok: true, jobs: merged });
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

  const body = await request.json();

  const title = String(body?.title || "").trim();
  const description = String(body?.description || "").trim();
  const price = Number(body?.price);
  const location = String(body?.location || "").trim();
  const providerId = String(body?.providerId || "").trim() || null;
  const serviceId = String(body?.serviceId || "").trim() || null;

  if (!title || !description || !Number.isFinite(price)) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields" },
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

  const job = await db.job.create({
    data: {
      title,
      description,
      postedById: actor.id,
      providerId,
      serviceId,
      location: location || null,
      price: Math.round(price),
      currency: String(body?.currency || "KES"),
    },
  });

  return NextResponse.json({ ok: true, job }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { actor, error } = await getSessionActor(request);
  if (error) return error;

  if (!actor || !hasAnyRole(actor, ["provider", "shopkeeper", "admin"])) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 },
    );
  }

  const body = await request.json();
  const id = String(body?.id || "").trim();
  const action = String(body?.action || "")
    .trim()
    .toLowerCase();

  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Job id is required" },
      { status: 400 },
    );
  }

  if (!["accept", "complete"].includes(action)) {
    return NextResponse.json(
      { ok: false, error: "Unsupported action" },
      { status: 400 },
    );
  }

  try {
    if (id.startsWith("manual-")) {
      const manualStatus = action === "complete" ? "completed" : "active";
      await prismaDb.authLog.create({
        data: {
          provider: "system",
          mode: MANUAL_UPDATE_MODE,
          email: actor.email,
          status: "SUCCESS",
          response: JSON.stringify({
            id,
            status: manualStatus,
            assigned: actor.name || actor.email || "Provider",
            providerId: actor.id,
          }),
        },
      });

      return NextResponse.json({
        ok: true,
        job: {
          id,
          status: manualStatus,
          providerId: actor.id,
          provider: { id: actor.id, name: actor.name },
        },
      });
    }

    const existing = await db.job.findUnique({
      where: { id },
      select: { id: true, providerId: true, status: true },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Job not found" },
        { status: 404 },
      );
    }

    if (existing.providerId && existing.providerId !== actor.id) {
      return NextResponse.json(
        { ok: false, error: "This job is already assigned" },
        { status: 409 },
      );
    }

    if (action === "complete" && !existing.providerId) {
      return NextResponse.json(
        { ok: false, error: "Job must be accepted before completion" },
        { status: 400 },
      );
    }

    if (
      action === "complete" &&
      !["active", "accepted", "in-progress", "in_progress"].includes(
        String(existing.status || "").toLowerCase(),
      )
    ) {
      return NextResponse.json(
        { ok: false, error: "Job must be active before completion" },
        { status: 400 },
      );
    }

    const updated = await db.job.update({
      where: { id },
      data: {
        providerId: existing.providerId || actor.id,
        status: action === "complete" ? "completed" : "active",
      },
      include: {
        provider: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ ok: true, job: updated });
  } catch (patchError) {
    if (isJobModelUnavailable(patchError)) {
      const manualStatus = action === "complete" ? "completed" : "active";
      await prismaDb.authLog.create({
        data: {
          provider: "system",
          mode: MANUAL_UPDATE_MODE,
          email: actor.email,
          status: "SUCCESS",
          response: JSON.stringify({
            id,
            status: manualStatus,
            assigned: actor.name || actor.email || "Provider",
            providerId: actor.id,
          }),
        },
      });

      return NextResponse.json({
        ok: true,
        job: {
          id,
          status: manualStatus,
          providerId: actor.id,
          provider: { id: actor.id, name: actor.name },
        },
      });
    }

    return NextResponse.json(
      {
        ok: false,
        error:
          patchError instanceof Error
            ? patchError.message
            : "Failed to accept job",
      },
      { status: 500 },
    );
  }
}
