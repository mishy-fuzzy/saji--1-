import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth";

const prismaDb: any = db;

type Severity = "info" | "warning" | "critical";

type AuditLogItem = {
  id: string;
  user: string;
  role: string;
  action: string;
  target: string;
  category: string;
  severity: Severity;
  time: string;
  timestamp: string;
  ip: string;
  device: string;
  location: string;
  reversible: boolean;
  reverted: boolean;
  flagged: boolean;
};

function safeParse(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function relativeTime(input: Date): string {
  const diffMs = Date.now() - input.getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function deriveCategory(mode: string): string {
  if (mode.includes("payment")) return "payment";
  if (mode.includes("verification")) return "verification";
  if (mode.includes("settings")) return "settings";
  if (mode.includes("security")) return "security";
  if (mode.includes("dispute")) return "dispute";
  if (mode.includes("team") || mode.includes("user")) return "user";
  return "system";
}

function deriveSeverity(status: string, mode: string): Severity {
  const normalizedStatus = status.toUpperCase();
  if (normalizedStatus !== "SUCCESS") return "critical";
  if (
    mode.includes("suspend") ||
    mode.includes("revert") ||
    mode.includes("delete")
  )
    return "warning";
  return "info";
}

function deriveAction(mode: string): string {
  const clean = mode.replace(/[-_]/g, " ").trim();
  if (!clean) return "system event";
  return clean;
}

async function collectFlaggedAndReverted(eventIds: string[]) {
  if (eventIds.length === 0) {
    return { flaggedIds: new Set<string>(), revertedIds: new Set<string>() };
  }

  const rows = await prismaDb.authLog.findMany({
    where: {
      provider: "system",
      mode: { in: ["admin-audit-flag", "admin-audit-revert"] },
      status: "SUCCESS",
    },
    select: { mode: true, response: true },
  });

  const flaggedIds = new Set<string>();
  const revertedIds = new Set<string>();

  for (const row of rows) {
    const payload = safeParse(row.response);
    const eventId = payload?.eventId ? String(payload.eventId) : "";
    if (!eventId || !eventIds.includes(eventId)) continue;

    if (row.mode === "admin-audit-flag") {
      const flagged = Boolean(payload?.flagged);
      if (flagged) flaggedIds.add(eventId);
      else flaggedIds.delete(eventId);
    }

    if (row.mode === "admin-audit-revert") {
      revertedIds.add(eventId);
    }
  }

  return { flaggedIds, revertedIds };
}

export async function GET(request: Request) {
  const { actor, error } = await getSessionActor(request);
  if (error) return error;
  if (!actor || !hasAnyRole(actor, ["admin"])) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const take = Math.min(
    500,
    Math.max(50, Number(searchParams.get("take") || "250")),
  );

  const rows = await prismaDb.authLog.findMany({
    where: {
      provider: { in: ["local", "system"] },
    },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      provider: true,
      mode: true,
      email: true,
      status: true,
      response: true,
      error: true,
      createdAt: true,
    },
  });

  const filtered = rows.filter(
    (row: any) =>
      !["admin-audit-flag", "admin-audit-revert", "notification"].includes(
        String(row.mode || ""),
      ),
  );

  const eventIds = filtered.map((row: any) => String(row.id));
  const { flaggedIds, revertedIds } = await collectFlaggedAndReverted(eventIds);

  const data: AuditLogItem[] = filtered.map((row: any) => {
    const payload = safeParse(row.response);
    const mode = String(row.mode || "");
    const status = String(row.status || "SUCCESS");
    const severity = deriveSeverity(status, mode);
    const category = deriveCategory(mode);

    const userEmail = String(payload?.by || row.email || "system");
    const roleRaw = String(payload?.role || "admin");
    const role = roleRaw.replace(/[-_]/g, " ");

    const target = String(
      payload?.target || payload?.email || row.email || mode,
    );

    return {
      id: String(row.id),
      user: userEmail,
      role,
      action: deriveAction(mode),
      target,
      category,
      severity,
      time: relativeTime(new Date(row.createdAt)),
      timestamp: new Date(row.createdAt).toLocaleString(),
      ip: String(payload?.ip || "N/A"),
      device: String(payload?.device || "Web"),
      location: String(payload?.location || "Unknown"),
      reversible: ["settings", "user", "payment"].includes(category),
      reverted: revertedIds.has(String(row.id)),
      flagged: flaggedIds.has(String(row.id)),
    };
  });

  return NextResponse.json({ ok: true, data });
}

export async function PATCH(request: Request) {
  const { actor, error } = await getSessionActor(request);
  if (error) return error;
  if (!actor || !hasAnyRole(actor, ["admin"])) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 },
    );
  }

  const body = await request.json();
  const eventId = String(body?.eventId || "").trim();
  const action = String(body?.action || "")
    .trim()
    .toLowerCase();

  if (!eventId || !["toggle-flag", "revert"].includes(action)) {
    return NextResponse.json(
      { ok: false, error: "eventId and valid action are required" },
      { status: 400 },
    );
  }

  const target = await prismaDb.authLog.findUnique({
    where: { id: eventId },
    select: { id: true, mode: true, email: true },
  });

  if (!target) {
    return NextResponse.json(
      { ok: false, error: "Audit event not found" },
      { status: 404 },
    );
  }

  if (action === "toggle-flag") {
    const flagged = Boolean(body?.flagged);
    await prismaDb.authLog.create({
      data: {
        provider: "system",
        mode: "admin-audit-flag",
        email: actor.email,
        status: "SUCCESS",
        response: JSON.stringify({ eventId, flagged, by: actor.email }),
      },
    });

    return NextResponse.json({ ok: true, data: { flagged } });
  }

  await prismaDb.authLog.create({
    data: {
      provider: "system",
      mode: "admin-audit-revert",
      email: actor.email,
      status: "SUCCESS",
      response: JSON.stringify({
        eventId,
        by: actor.email,
        target: target.email || target.mode,
      }),
    },
  });

  return NextResponse.json({ ok: true, data: { reverted: true } });
}
