import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/server/db";
import { createInAppNotification } from "@/lib/server/in-app-notifications";
import {
  markInviteState,
  resolveInviteByToken,
} from "@/lib/server/team-promotion-invites";
import { resolveAppUrlFromRequest } from "@/lib/server/app-url";

const TEAM_ROLES = new Set(["subadmin", "secretary", "agent"]);

function normalizeRole(value: string | null | undefined): string {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");

  if (normalized === "sub-admin") return "subadmin";
  if (normalized === "subadmin") return "subadmin";
  return normalized;
}

function resolveLoginPath(role: string): string {
  if (role === "subadmin") return "/subadmin";
  if (role === "secretary") return "/secretary";
  if (role === "agent") return "/agent";
  return "/team-login";
}

function resolveTeamLoginUrl(role: string): string {
  const destination = resolveLoginPath(role);
  return `/team-login?next=${encodeURIComponent(destination)}`;
}

async function ensureRoleProfile(
  tx: Prisma.TransactionClient,
  role: string,
  userId: string,
) {
  if (role === "secretary") {
    await tx.secretary.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
    return;
  }

  if (role === "agent") {
    await tx.agent.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = String(searchParams.get("token") || "").trim();

  const appUrl = resolveAppUrlFromRequest(request);

  if (!token) {
    console.error("[INVITE] No token provided");
    return NextResponse.json(
      { ok: false, error: "No invitation token provided" },
      { status: 400 }
    );
  }

  const invite = await resolveInviteByToken(token);
  if (!invite.ok) {
    const reason = String(invite.reason || "invalid");
    console.error(`[INVITE] Token validation failed: ${reason}`);
    return NextResponse.json(
      { ok: false, error: `Invalid or ${reason} invitation token` },
      { status: 400 }
    );
  }

  const targetRole = normalizeRole(invite.targetRole);
  if (!TEAM_ROLES.has(targetRole)) {
    console.error(`[INVITE] Invalid role: ${targetRole}`);
    return NextResponse.json(
      { ok: false, error: "Invalid team role" },
      { status: 400 }
    );
  }

  try {
    const updatedUser = await db.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: invite.userId },
        data: {
          role: targetRole,
          isSuspended: false,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      await ensureRoleProfile(tx, targetRole, user.id);

      await tx.authLog.create({
        data: {
          provider: "local",
          mode: "admin-team-promotion-accepted",
          email: user.email,
          status: "SUCCESS",
          response: JSON.stringify({
            inviteId: invite.inviteId,
            userId: user.id,
            targetRole,
            previousRole: invite.previousRole,
            invitedBy: invite.invitedBy,
          }),
        },
      });

      await tx.authLog.create({
        data: {
          provider: "local",
          mode: "admin-team-create",
          email: user.email,
          status: "SUCCESS",
          response: JSON.stringify({
            by: invite.invitedBy,
            role: targetRole,
            previousRole: invite.previousRole,
            inviteId: invite.inviteId,
            acceptedBy: user.email,
          }),
        },
      });

      return user;
    });

    await markInviteState({
      inviteId: invite.inviteId,
      email: invite.email,
      state: "accepted",
      by: updatedUser.email,
    });

    await createInAppNotification({
      userId: updatedUser.id,
      type: "success",
      title: "Invitation accepted",
      message: `Your ${targetRole.replace("-", " ")} role is now active.`,
      actionHref: resolveTeamLoginUrl(targetRole),
      metadata: {
        invitedBy: invite.invitedBy,
        previousRole: invite.previousRole,
      },
    });

    await db.authLog.create({
      data: {
        provider: "local",
        mode: "admin-team-promotion-link-clicked",
        email: updatedUser.email,
        status: "SUCCESS",
        response: JSON.stringify({
          inviteId: invite.inviteId,
          targetRole,
        }),
      },
    });

    console.log(
      `[INVITE] ✅ Invitation accepted for ${updatedUser.email} (role: ${targetRole})`
    );

    return NextResponse.json({
      ok: true,
      message: "Invitation accepted successfully",
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: targetRole,
        loginUrl: resolveTeamLoginUrl(targetRole),
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[INVITE] ❌ Failed to accept invitation:`, errorMsg);
    return NextResponse.json(
      { ok: false, error: "Failed to process invitation" },
      { status: 500 }
    );
  }
}
