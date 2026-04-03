import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth";
import { createInAppNotification } from "@/lib/server/in-app-notifications";
import { sendEmail } from "@/lib/server/mailer";
import { createPromotionInvite } from "@/lib/server/team-promotion-invites";

const prismaDb: any = db;

const TEAM_ROLES = new Set(["subadmin", "secretary", "agent"]);
const RESTORABLE_ROLES = new Set([
  "customer",
  "provider",
  "shopkeeper",
  "admin",
  "subadmin",
  "secretary",
  "agent",
]);

function normalizeRole(value: string | null | undefined): string {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");

  if (normalized === "sub-admin") return "subadmin";
  if (normalized === "subadmin") return "subadmin";
  return normalized;
}

function mapTeamRoleForUi(role: string): "sub-admin" | "secretary" | "agent" {
  if (role === "subadmin") return "sub-admin";
  if (role === "secretary") return "secretary";
  return "agent";
}

function normalizeRestorableRole(value: unknown): string | null {
  const normalized = normalizeRole(String(value || ""));
  if (!RESTORABLE_ROLES.has(normalized)) return null;
  if (TEAM_ROLES.has(normalized)) return null;
  return normalized;
}

function inferFallbackRole(member: {
  customerProfile?: { userId: string } | null;
  serviceProviderProfile?: { userId: string } | null;
  services?: Array<{ id: string }>;
}): string {
  if (member.serviceProviderProfile || (member.services || []).length > 0) {
    return "provider";
  }
  if (member.customerProfile) {
    return "customer";
  }
  return "customer";
}

function safeParse(value: string | null | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function resolveAppUrl(requestOrigin?: string): string {
  // Prefer the active request origin to avoid stale env hosts causing 404 links.
  if (requestOrigin) return requestOrigin.replace(/\/$/, "");
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  return "http://localhost:3500";
}

async function getPreviousRoleFromLatestPromotion(
  email: string,
): Promise<string | null> {
  const latest = await prismaDb.authLog.findFirst({
    where: {
      provider: "local",
      mode: "admin-team-promotion-accepted",
      email,
      status: "SUCCESS",
    },
    orderBy: { createdAt: "desc" },
    select: { response: true },
  });

  const payload = safeParse(latest?.response);
  return normalizeRestorableRole(payload.previousRole ?? null);
}

async function queueTeamInviteEmail(params: {
  email: string;
  name: string;
  phone?: string | null;
  role: string;
  invitedByEmail: string | null;
  inviteUrl: string;
}) {
  const roleLabel = mapTeamRoleForUi(params.role).replace("-", " ");
  const subject = `Team Invitation: Join SAJI as ${roleLabel}`;
  const phoneInfo = params.phone ? `\nPhone: ${params.phone}` : "";
  const text = [
    `Hello ${params.name},`,
    "",
    `${params.invitedByEmail || "An administrator"} has invited you to join the SAJI team as a ${roleLabel}.`,
    `Email: ${params.email}${phoneInfo}`,
    "",
    "To accept this invitation and create your account, click this secure link:",
    params.inviteUrl,
    "",
    "This link expires in 7 days.",
  ].join("\n");
  const phoneHtml = params.phone ? `<p><strong>Phone:</strong> ${params.phone}</p>` : "";
  const html = `
    <p>Hello ${params.name},</p>
    <p>${params.invitedByEmail || "An administrator"} has invited you to join the SAJI team as a <strong>${roleLabel}</strong>.</p>
    <p><strong>Email:</strong> ${params.email}</p>
    ${phoneHtml}
    <p>To accept this invitation and create your account, click the secure button below:</p>
    <p><a href="${params.inviteUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;">Accept Invitation</a></p>
    <p>Or copy and paste this link into your browser:</p>
    <p>${params.inviteUrl}</p>
    <p>This link expires in 7 days.</p>
  `;

  try {
    const result = await sendEmail({
      to: params.email,
      subject,
      text,
      html,
    });

    await prismaDb.notificationLog.create({
      data: {
        provider: "smtp",
        channel: "email",
        recipient: params.email,
        message: subject,
        status: "SENT",
        response: JSON.stringify(result),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Email send failed";
    await prismaDb.notificationLog.create({
      data: {
        provider: "smtp",
        channel: "email",
        recipient: params.email,
        message: subject,
        status: "FAILED",
        error: message,
      },
    });
    throw error;
  }
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

  const rows = await prismaDb.user.findMany({
    where: {
      deletedAt: null,
      role: { in: Array.from(TEAM_ROLES) },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isSuspended: true,
      createdAt: true,
    },
  });

  const data = rows.map((row: any) => ({
    id: row.id,
    name: row.name || "Unnamed User",
    email: row.email,
    role: mapTeamRoleForUi(String(row.role || "")),
    status: row.isSuspended ? "inactive" : "active",
    joinedDate: new Date(row.createdAt).toISOString().split("T")[0],
    credentialsSent: true,
  }));

  return NextResponse.json({ ok: true, data });
}

export async function POST(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error) return error;
    if (!actor || !hasAnyRole(actor, ["admin"])) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "")
      .trim()
      .toLowerCase();
    const phone = String(body?.phone || "").trim() || null;
    const role = normalizeRole(body?.role);

    if (!name || !email || !role) {
      return NextResponse.json(
        { ok: false, error: "name, email and role are required" },
        { status: 400 },
      );
    }

    if (!TEAM_ROLES.has(role)) {
      return NextResponse.json(
        { ok: false, error: "invalid team role" },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { ok: false, error: "invalid email format" },
        { status: 400 },
      );
    }

    const existing = await prismaDb.user.findUnique({
      where: { email },
      select: {
        id: true,
        role: true,
        customerProfile: { select: { userId: true } },
        serviceProviderProfile: { select: { userId: true } },
        services: { select: { id: true }, take: 1 },
      },
    });

    const created = await prismaDb.user.upsert({
      where: { email },
      update: {
        name,
        phone,
        isSuspended: false,
        deletedAt: null,
      },
      create: {
        name,
        email,
        phone,
        isSuspended: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isSuspended: true,
        createdAt: true,
      },
    });

    const currentRole = normalizeRole(created.role);
    let previousRole = normalizeRestorableRole(existing?.role);
    if (!previousRole && TEAM_ROLES.has(currentRole)) {
      previousRole = await getPreviousRoleFromLatestPromotion(created.email);
    }
    if (!previousRole) {
      previousRole = inferFallbackRole(existing || created);
    }

    const invite = await createPromotionInvite({
      email: created.email,
      userId: created.id,
      targetRole: role,
      previousRole,
      invitedBy: actor.email,
    });

    const appUrl = resolveAppUrl(new URL(request.url).origin);
    const inviteUrl = `${appUrl}/team-invite?token=${encodeURIComponent(invite.token)}`;

    await prismaDb.authLog.create({
      data: {
        provider: "local",
        mode: "admin-team-promotion-requested",
        email: created.email,
        status: "SUCCESS",
        response: JSON.stringify({
          by: actor.email,
          targetRole: role,
          inviteId: invite.inviteId,
          previousRole,
        }),
      },
    });

  let invitationStatus: "sent" | "email_failed" = "sent";
  let invitationError: string | undefined;

  try {
    await queueTeamInviteEmail({
      email: created.email,
      name: created.name || "Team member",
      phone: created.phone,
      role,
      invitedByEmail: actor.email,
      inviteUrl,
    });
  } catch (emailError) {
    invitationStatus = "email_failed";
    invitationError =
      emailError instanceof Error
        ? emailError.message
        : "Failed to send invite email";
  }

  await createInAppNotification({
    userId: created.id,
    type: "warning",
    title: "Team Invitation",
    message: `You've been invited to join SAJI as a ${mapTeamRoleForUi(role).replace("-", " ")}. Check your email at ${created.email} to accept.`,
    actionHref: "/team-login",
    metadata: { invitedBy: actor.email },
  });

  await prismaDb.authLog.create({
    data: {
      provider: "local",
      mode: "admin-team-promotion-email",
      email: created.email,
      status: invitationStatus === "sent" ? "SUCCESS" : "FAILED",
      response: JSON.stringify({
        by: actor.email,
        targetRole: role,
        inviteId: invite.inviteId,
        inviteUrl,
        invitationStatus,
        invitationError,
      }),
    },
  });

  return NextResponse.json({
    ok: true,
    data: {
      id: created.id,
      name: created.name || "Unnamed User",
      email: created.email,
      role: mapTeamRoleForUi(role),
      status: "inactive",
      joinedDate: new Date(created.createdAt).toISOString().split("T")[0],
      credentialsSent: false,
    },
    invitation: {
      email: created.email,
      loginUrl: inviteUrl,
      status: invitationStatus,
      expiresAt: invite.expiresAt,
      error: invitationError,
    },
  });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to add team member";
    console.error("Team member creation error:", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
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
  const id = String(body?.id || "").trim();
  const action = String(body?.action || "")
    .trim()
    .toLowerCase();

  if (!id || action !== "resend-invite") {
    return NextResponse.json(
      { ok: false, error: "id and action=resend-invite are required" },
      { status: 400 },
    );
  }

  const member = await prismaDb.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      deletedAt: true,
      customerProfile: { select: { userId: true } },
      serviceProviderProfile: { select: { userId: true } },
      services: { select: { id: true }, take: 1 },
    },
  });

  if (!member || member.deletedAt) {
    return NextResponse.json(
      { ok: false, error: "Team member not found" },
      { status: 404 },
    );
  }

  const role = normalizeRole(member.role);
  if (!TEAM_ROLES.has(role)) {
    return NextResponse.json(
      { ok: false, error: "Only team members can receive invites" },
      { status: 400 },
    );
  }

  const previousRoleFromHistory = await getPreviousRoleFromLatestPromotion(
    member.email,
  );
  const previousRole =
    previousRoleFromHistory || inferFallbackRole(member) || "customer";

  const invite = await createPromotionInvite({
    email: member.email,
    userId: member.id,
    targetRole: role,
    previousRole,
    invitedBy: actor.email,
  });

  const appUrl = resolveAppUrl(new URL(request.url).origin);
    const inviteUrl = `${appUrl}/team-invite?token=${encodeURIComponent(invite.token)}`;

  let invitationStatus: "sent" | "email_failed" = "sent";
  let invitationError: string | undefined;

  try {
    await queueTeamInviteEmail({
      email: member.email,
      name: member.name || "Team member",
      phone: member.phone,
      role,
      invitedByEmail: actor.email,
      inviteUrl,
    });
  } catch (emailError) {
    invitationStatus = "email_failed";
    invitationError =
      emailError instanceof Error
        ? emailError.message
        : "Failed to resend invite email";
  }

  await prismaDb.authLog.create({
    data: {
      provider: "local",
      mode: "admin-team-invite-resend",
      email: member.email,
      status: "SUCCESS",
      response: JSON.stringify({
        by: actor.email,
        role: member.role,
        inviteId: invite.inviteId,
        inviteUrl,
        invitationStatus,
        invitationError,
      }),
    },
  });

  return NextResponse.json({
    ok: true,
    invitation: {
      email: member.email,
      loginUrl: inviteUrl,
      status: invitationStatus,
      error: invitationError,
      expiresAt: invite.expiresAt,
    },
  });
}

export async function DELETE(request: Request) {
  const { actor, error } = await getSessionActor(request);
  if (error) return error;
  if (!actor || !hasAnyRole(actor, ["admin"])) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const id = String(searchParams.get("id") || "").trim();
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "id is required" },
      { status: 400 },
    );
  }

  const existing = await prismaDb.user.findUnique({
    where: { id },
    select: {
      id: true,
      role: true,
      email: true,
      deletedAt: true,
      customerProfile: { select: { userId: true } },
      serviceProviderProfile: { select: { userId: true } },
      services: {
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!existing || existing.deletedAt) {
    return NextResponse.json(
      { ok: false, error: "Team member not found" },
      { status: 404 },
    );
  }

  if (!TEAM_ROLES.has(normalizeRole(existing.role))) {
    return NextResponse.json(
      { ok: false, error: "Only team members can be removed from this screen" },
      { status: 400 },
    );
  }

  const latestAssignment = await prismaDb.authLog.findFirst({
    where: {
      provider: "local",
      mode: { in: ["admin-team-promotion-accepted", "admin-team-create"] },
      email: existing.email,
      status: "SUCCESS",
    },
    orderBy: { createdAt: "desc" },
    select: { response: true },
  });

  let assignmentPayload: any = null;
  if (latestAssignment?.response) {
    try {
      assignmentPayload = JSON.parse(latestAssignment.response);
    } catch {
      assignmentPayload = null;
    }
  }

  const restoredRole =
    normalizeRestorableRole(assignmentPayload?.previousRole) ||
    inferFallbackRole(existing);

  await prismaDb.user.update({
    where: { id },
    data: {
      role: restoredRole,
      deletedAt: null,
      isSuspended: false,
    },
  });

  await prismaDb.authLog.create({
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

  return NextResponse.json({
    ok: true,
    data: {
      id,
      restoredRole,
    },
  });
}
