import crypto from "node:crypto";
import { db } from "@/lib/server/db";

const INVITE_MODE = "admin-team-promotion-invite";
const STATUS_MODE = "admin-team-promotion-invite-status";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function randomToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function safeParse(value: string | null | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function toIsoDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export async function createPromotionInvite(params: {
  email: string;
  userId: string;
  targetRole: string;
  previousRole: string;
  invitedBy: string;
  expiresInDays?: number;
}) {
  const token = randomToken();
  const tokenHash = hashToken(token);
  const expiresAt = toIsoDate(params.expiresInDays ?? 7);

  const invite = await db.authLog.create({
    data: {
      provider: "local",
      mode: INVITE_MODE,
      email: params.email,
      status: "SUCCESS",
      response: JSON.stringify({
        userId: params.userId,
        targetRole: params.targetRole,
        previousRole: params.previousRole,
        invitedBy: params.invitedBy,
        tokenHash,
        expiresAt,
      }),
    },
    select: { id: true },
  });

  await db.authLog.create({
    data: {
      provider: "local",
      mode: STATUS_MODE,
      email: params.email,
      status: "SUCCESS",
      response: JSON.stringify({
        inviteId: invite.id,
        state: "pending",
        by: params.invitedBy,
      }),
    },
  });

  return {
    inviteId: invite.id,
    token,
    expiresAt,
  };
}

async function getInviteState(inviteId: string): Promise<string> {
  const rows = await db.authLog.findMany({
    where: {
      provider: "local",
      mode: STATUS_MODE,
      status: "SUCCESS",
    },
    orderBy: { createdAt: "desc" },
    take: 2000,
    select: { response: true },
  });

  for (const row of rows) {
    const payload = safeParse(row.response);
    if (String(payload.inviteId || "") !== inviteId) continue;
    return String(payload.state || "pending");
  }

  return "pending";
}

export async function resolveInviteByToken(token: string) {
  const tokenHash = hashToken(token);

  const rows = await db.authLog.findMany({
    where: {
      provider: "local",
      mode: INVITE_MODE,
      status: "SUCCESS",
    },
    orderBy: { createdAt: "desc" },
    take: 1000,
    select: {
      id: true,
      email: true,
      response: true,
      createdAt: true,
    },
  });

  for (const row of rows) {
    const payload = safeParse(row.response);
    if (String(payload.tokenHash || "") !== tokenHash) continue;

    const expiresAt = String(payload.expiresAt || "");
    if (!expiresAt || new Date(expiresAt).getTime() < Date.now()) {
      return { ok: false as const, reason: "expired" };
    }

    const state = await getInviteState(row.id);
    if (state !== "pending") {
      return { ok: false as const, reason: state };
    }

    return {
      ok: true as const,
      inviteId: row.id,
      email: String(row.email || ""),
      userId: String(payload.userId || ""),
      targetRole: String(payload.targetRole || ""),
      previousRole: String(payload.previousRole || "customer"),
      invitedBy: String(payload.invitedBy || ""),
      expiresAt,
    };
  }

  return { ok: false as const, reason: "not_found" };
}

export async function markInviteState(params: {
  inviteId: string;
  email: string;
  state: "accepted" | "revoked" | "expired";
  by: string;
}) {
  await db.authLog.create({
    data: {
      provider: "local",
      mode: STATUS_MODE,
      email: params.email,
      status: "SUCCESS",
      response: JSON.stringify({
        inviteId: params.inviteId,
        state: params.state,
        by: params.by,
      }),
    },
  });
}
