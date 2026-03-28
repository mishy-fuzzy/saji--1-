import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/server/db";
import { createInAppNotification } from "@/lib/server/in-app-notifications";
import {
  markInviteState,
  resolveInviteByToken,
} from "@/lib/server/team-promotion-invites";

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
  if (role === "subadmin") return "/sub-admin";
  if (role === "secretary") return "/secretary";
  if (role === "agent") return "/agent";
  return "/team-login";
}

function resolveAppUrl(requestOrigin: string): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  return requestOrigin.replace(/\/$/, "");
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
  const { searchParams, origin } = new URL(request.url);
  const token = String(searchParams.get("token") || "").trim();

  const appUrl = resolveAppUrl(origin);

  if (!token) {
    return NextResponse.redirect(`${appUrl}/team-login?promotion=invalid`);
  }

  const invite = await resolveInviteByToken(token);
  if (!invite.ok) {
    const reason = encodeURIComponent(String(invite.reason || "invalid"));
    return NextResponse.redirect(`${appUrl}/team-login?promotion=${reason}`);
  }

  const targetRole = normalizeRole(invite.targetRole);
  if (!TEAM_ROLES.has(targetRole)) {
    return NextResponse.redirect(`${appUrl}/team-login?promotion=invalid-role`);
  }

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
    title: "Promotion accepted",
    message: `Your ${targetRole.replace("-", " ")} privileges are now active.`,
    actionHref: resolveLoginPath(targetRole),
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

  return NextResponse.redirect(
    `${appUrl}/team-login?promotion=accepted&role=${encodeURIComponent(targetRole)}`,
  );
}
