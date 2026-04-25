import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { verifyPassword } from "@/lib/server/password";
import { createSessionCookie } from "@/lib/server/session";

const prismaDb: any = db;
const REFERRAL_REWARD_KES = 500;

async function attachReferralIfMissingOnLogin(data: {
  referredId: string;
  referrerIdRaw?: string;
}) {
  const referrerId = String(data.referrerIdRaw || "").trim();
  if (!referrerId || referrerId === data.referredId) {
    return;
  }

  const referrer = await prismaDb.user.findUnique({
    where: { id: referrerId },
    select: { id: true },
  });

  if (!referrer) {
    return;
  }

  await prismaDb.referral.upsert({
    where: { referredId: data.referredId },
    update: {},
    create: {
      referrerId: referrer.id,
      referredId: data.referredId,
      status: "pending",
    },
  });
}

async function finalizeReferralOnLogin(userId: string, userEmail: string) {
  const referral = await prismaDb.referral.findUnique({
    where: { referredId: userId },
    select: {
      id: true,
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

  await prismaDb.$transaction(async (tx: any) => {
    const updated = await tx.referral.updateMany({
      where: {
        referredId: userId,
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
        email: userEmail,
        status: "SUCCESS",
        response: JSON.stringify({
          referredId: userId,
          referrerId: referral.referrerId,
          reward: rewardAmount,
        }),
      },
    });
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = String(body?.identifier || "").trim();
    const email = String(body?.email || "")
      .trim()
      .toLowerCase();
    const phone = String(body?.phone || "").trim();
    const name = String(body?.name || "").trim();
    const password = String(body?.password || "");
    const referrerIdRaw = String(body?.referrerId || "");

    if ((!email && !phone && !identifier && !name) || !password) {
      return NextResponse.json(
        { ok: false, error: "credentials are required" },
        { status: 400 },
      );
    }

    const resolvedEmail =
      email || (identifier.includes("@") ? identifier.toLowerCase() : "");
    const resolvedPhone =
      phone ||
      (!resolvedEmail && /^\+?[0-9\s\-()]{7,}$/.test(identifier)
        ? identifier
        : "");
    const resolvedName =
      name || (!resolvedEmail && !resolvedPhone ? identifier : "");

    const whereClause = resolvedEmail
      ? { email: resolvedEmail }
      : resolvedPhone
        ? { phone: resolvedPhone }
        : { name: resolvedName };

    const user = await prismaDb.user.findFirst({
      where: {
        deletedAt: null,
        ...whereClause,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        image: true,
        passwordHash: true,
        isSuspended: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user && resolvedEmail) {
      const archived = await prismaDb.user.findUnique({
        where: { email: resolvedEmail },
        select: { id: true, deletedAt: true },
      });

      if (archived?.deletedAt) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "account is deactivated. Use Reactivate account to restore access",
          },
          { status: 403 },
        );
      }
    }

    if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { ok: false, error: "invalid credentials" },
        { status: 401 },
      );
    }

    if (user.isSuspended) {
      return NextResponse.json(
        { ok: false, error: "account is suspended" },
        { status: 403 },
      );
    }

    let shopkeeperRegistrationStatus: "not_submitted" | "pending" | "approved" | "rejected" = "not_submitted";
    if (String(user.role || "").toLowerCase() === "shopkeeper") {
      const latestRegistration = await prismaDb.authLog.findFirst({
        where: {
          provider: "local",
          mode: "shopkeeper-registration",
          email: user.email,
        },
        orderBy: { createdAt: "desc" },
        select: { status: true },
      });

      const normalized = String(latestRegistration?.status || "").toLowerCase();
      if (normalized === "approved") {
        shopkeeperRegistrationStatus = "approved";
      } else if (normalized === "rejected") {
        shopkeeperRegistrationStatus = "rejected";
      } else if (normalized === "pending") {
        shopkeeperRegistrationStatus = "pending";
      }
    }

    await prismaDb.authLog.create({
      data: {
        provider: "local",
        mode: "login",
        email: user.email,
        status: "SUCCESS",
        response: JSON.stringify({ role: user.role }),
      },
    });

    try {
      await attachReferralIfMissingOnLogin({
        referredId: user.id,
        referrerIdRaw,
      });
      await finalizeReferralOnLogin(user.id, String(user.email || ""));
    } catch {
      // Keep login successful even if referral completion fails.
    }

    const response = NextResponse.json({
      ok: true,
      data: {
        id: user.id,
        name: user.name || "User",
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        avatar: user.image || "",
        emailVerified: user.emailVerified,
        shopkeeperRegistrationComplete:
          String(user.role || "").toLowerCase() === "shopkeeper"
            ? shopkeeperRegistrationStatus !== "not_submitted"
            : true,
        shopkeeperRegistrationStatus,
        createdAt: user.createdAt,
      },
    });

    response.headers.append(
      "Set-Cookie",
      createSessionCookie({
        userId: user.id,
        role: user.role,
        email: user.email,
      }),
    );

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
