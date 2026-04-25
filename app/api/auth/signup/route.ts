import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { hashPassword } from "@/lib/server/password";
import { createSessionCookie } from "@/lib/server/session";

const prismaDb: any = db;
const REFERRAL_REWARD_KES = 500;

async function logSignupEvent(data: {
  email?: string;
  status: "SUCCESS" | "FAILED";
  role?: string;
  error?: string;
}) {
  try {
    await prismaDb.authLog.create({
      data: {
        provider: "local",
        mode: "signup",
        email: data.email,
        status: data.status,
        response: data.role ? JSON.stringify({ role: data.role }) : undefined,
        error: data.error,
      },
    });
  } catch {
    // Keep signup behavior stable even when auth logging fails.
  }
}

const PUBLIC_SIGNUP_ROLES = new Set(["customer", "provider", "shopkeeper"]);

function normalizeRole(roleRaw: string): string {
  return PUBLIC_SIGNUP_ROLES.has(roleRaw) ? roleRaw : "customer";
}

async function createRoleProfile(tx: any, role: string, userId: string) {
  if (role === "customer") {
    await tx.customer.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
    return;
  }

  if (role === "provider") {
    await tx.serviceProvider.upsert({
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
    return;
  }

  if (role === "secretary") {
    await tx.secretary.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
    return;
  }

  // shopkeeper currently uses user role only and no dedicated profile table.
}

async function attachReferralIfProvided(tx: any, data: {
  referredId: string;
  referrerIdRaw?: string;
}) {
  const referrerId = String(data.referrerIdRaw || "").trim();
  if (!referrerId || referrerId === data.referredId) {
    return;
  }

  const referrer = await tx.user.findUnique({
    where: { id: referrerId },
    select: { id: true },
  });

  if (!referrer) {
    return;
  }

  await tx.referral.upsert({
    where: { referredId: data.referredId },
    update: { referrerId: referrer.id },
    create: {
      referrerId: referrer.id,
      referredId: data.referredId,
      status: "pending",
    },
  });
}

async function finalizeReferralForUser(tx: any, data: {
  referredId: string;
  referredEmail: string;
}) {
  const referral = await tx.referral.findUnique({
    where: { referredId: data.referredId },
    select: {
      referrerId: true,
      status: true,
      reward: true,
    },
  });

  if (!referral) {
    return;
  }

  if (String(referral.status || "").toLowerCase() === "completed") {
    return;
  }

  const rewardAmount = Number(referral.reward || REFERRAL_REWARD_KES);

  const updated = await tx.referral.updateMany({
    where: {
      referredId: data.referredId,
      status: {
        not: "completed",
      },
    },
    data: {
      status: "completed",
      reward: rewardAmount,
    },
  });

  if (!updated?.count) {
    return;
  }

  await tx.wallet.upsert({
    where: { userId: referral.referrerId },
    update: {
      balance: {
        increment: rewardAmount,
      },
    },
    create: {
      userId: referral.referrerId,
      balance: rewardAmount,
      currency: "KES",
    },
  });

  await tx.authLog.create({
    data: {
      provider: "local",
      mode: "referral-completed",
      email: data.referredEmail,
      status: "SUCCESS",
      response: JSON.stringify({
        referredId: data.referredId,
        referrerId: referral.referrerId,
        reward: rewardAmount,
        source: "signup",
      }),
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "")
      .trim()
      .toLowerCase();
    const phone = String(body?.phone || "").trim();
    const password = String(body?.password || "");
    const referrerIdRaw = String(body?.referrerId || "");
    const roleRaw = String(body?.role || "customer")
      .trim()
      .toLowerCase();

    if (!name || !email || !phone) {
      await logSignupEvent({
        email: email || undefined,
        status: "FAILED",
        error: "name, email and phone are required",
      });
      return NextResponse.json(
        { error: "name, email and phone are required" },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      await logSignupEvent({
        email,
        status: "FAILED",
        error: "invalid email format",
      });
      return NextResponse.json(
        { error: "invalid email format" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      await logSignupEvent({
        email,
        status: "FAILED",
        error: "password must be at least 8 characters",
      });
      return NextResponse.json(
        { error: "password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const role = normalizeRole(roleRaw);
    const passwordHash = hashPassword(password);

    const existing = await prismaDb.user.findUnique({
      where: { email },
      select: {
        id: true,
        role: true,
        deletedAt: true,
        passwordHash: true,
      },
    });

    const created = await prismaDb.$transaction(async (tx: any) => {
      if (existing && !existing.deletedAt && existing.passwordHash) {
        return null;
      }

      const user = existing
        ? await tx.user.update({
            where: { id: existing.id },
            data: {
              name,
              phone,
              passwordHash,
              role: existing.deletedAt ? role : existing.role,
              isSuspended: false,
              deletedAt: null,
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
          })
        : await tx.user.create({
            data: {
              name,
              email,
              passwordHash,
              phone,
              role,
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

      await createRoleProfile(tx, user.role, user.id);
      await attachReferralIfProvided(tx, {
        referredId: user.id,
        referrerIdRaw,
      });
      await finalizeReferralForUser(tx, {
        referredId: user.id,
        referredEmail: user.email,
      });
      return user;
    });

    if (!created) {
      await logSignupEvent({
        email,
        status: "FAILED",
        error: "An account with this email already exists",
      });
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    await logSignupEvent({
      email,
      status: "SUCCESS",
      role,
    });

    const response = NextResponse.json(
      { ok: true, data: created },
      { status: 201 },
    );
    response.headers.append(
      "Set-Cookie",
      createSessionCookie({
        userId: created.id,
        role: created.role,
        email: created.email,
      }),
    );

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signup failed";
    await logSignupEvent({ status: "FAILED", error: message });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
