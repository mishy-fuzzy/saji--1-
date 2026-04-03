import { NextResponse } from "next/server";
import { resolveInviteByToken } from "@/lib/server/team-promotion-invites";

function normalizeRole(value: string | null | undefined): string {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");

  if (normalized === "sub-admin") return "subadmin";
  if (normalized === "subadmin") return "subadmin";
  return normalized;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = String(searchParams.get("token") || "").trim();

  if (!token) {
    return NextResponse.json(
      { ok: false, error: "No invitation token provided" },
      { status: 400 }
    );
  }

  const invite = await resolveInviteByToken(token);
  if (!invite.ok) {
    const reason = String(invite.reason || "invalid");
    return NextResponse.json(
      { ok: false, error: `Invalid or ${reason} invitation token` },
      { status: 400 }
    );
  }

  const targetRole = normalizeRole(invite.targetRole);

  return NextResponse.json({
    ok: true,
    data: {
      email: invite.email,
      role: targetRole,
      expiresAt: invite.expiresAt,
    },
  });
}
