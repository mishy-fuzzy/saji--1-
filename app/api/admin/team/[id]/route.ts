import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth";

function normalizeRole(value: string | null | undefined): string {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");

  if (normalized === "sub-admin") return "subadmin";
  if (normalized === "subadmin") return "subadmin";
  return normalized;
}

const TEAM_ROLES = new Set(["subadmin", "secretary", "agent"]);

function safeParse(value: string | null | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function normalizeRestorableRole(value: unknown): string | null {
  const normalized = normalizeRole(String(value || ""));
  if (!normalized) return null;
  if (TEAM_ROLES.has(normalized)) return null;
  if (
    [
      "customer",
      "provider",
      "shopkeeper",
      "admin",
      "subadmin",
      "secretary",
      "agent",
    ].includes(normalized)
  ) {
    return normalized;
  }
  return null;
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { actor, error } = await getSessionActor(request);
  if (error) return error;
  if (!actor || !hasAnyRole(actor, ["admin"])) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 },
    );
  }

  const { id } = await context.params;

  const existing = await db.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });

  if (!existing) {
    return NextResponse.json(
      { ok: false, error: "Team member not found" },
      { status: 404 },
    );
  }

  const normalizedRole = normalizeRole(existing.role);
  if (!TEAM_ROLES.has(normalizedRole)) {
    return NextResponse.json(
      { ok: false, error: "Only team roles can be revoked" },
      { status: 400 },
    );
  }

  const latestPromotion = await db.authLog.findFirst({
    where: {
      provider: "local",
      mode: { in: ["admin-team-promotion-accepted", "admin-team-create"] },
      email: existing.email,
      status: "SUCCESS",
    },
    orderBy: { createdAt: "desc" },
    select: { response: true },
  });

  const payload = safeParse(latestPromotion?.response);
  const restoredRole =
    normalizeRestorableRole(payload.previousRole) || "customer";

  await db.user.update({
    where: { id },
    data: {
      role: restoredRole,
      deletedAt: null,
      isSuspended: false,
    },
  });

  await db.authLog.create({
    data: {
      provider: "local",
      mode: "admin-team-revoke",
      email: existing.email,
      status: "SUCCESS",
      response: JSON.stringify({
        by: actor.email,
        fromRole: existing.role,
        restoredRole,
      }),
    },
  });

  return NextResponse.json({ ok: true });
}
