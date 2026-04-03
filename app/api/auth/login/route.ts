import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { verifyPassword } from "@/lib/server/password";
import { createSessionCookie } from "@/lib/server/session";

const prismaDb: any = db;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email || "")
      .trim()
      .toLowerCase();
    const phone = String(body?.phone || "").trim();
    const password = String(body?.password || "");

    if ((!email && !phone) || !password) {
      return NextResponse.json(
        { ok: false, error: "credentials are required" },
        { status: 400 },
      );
    }

    const user = await prismaDb.user.findFirst({
      where: {
        deletedAt: null,
        ...(email ? { email } : { phone }),
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

    if (!user && email) {
      const archived = await prismaDb.user.findUnique({
        where: { email },
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
