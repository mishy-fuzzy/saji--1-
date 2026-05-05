import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { createSessionCookie, getSessionFromRequest } from "@/lib/server/session";

function extractShopNameFromRegistration(responseValue: unknown): string {
  if (typeof responseValue !== "string" || !responseValue.trim()) {
    return "";
  }

  try {
    const parsed = JSON.parse(responseValue) as {
      form?: { shopName?: unknown };
    };
    return typeof parsed?.form?.shopName === "string"
      ? parsed.form.shopName.trim()
      : "";
  } catch {
    return "";
  }
}

function extractShopNameFromSettings(responseValue: unknown): string {
  if (typeof responseValue !== "string" || !responseValue.trim()) {
    return "";
  }

  try {
    const parsed = JSON.parse(responseValue) as {
      shopName?: unknown;
    };

    return typeof parsed?.shopName === "string" ? parsed.shopName.trim() : "";
  } catch {
    return "";
  }
}

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session?.userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    let user: {
      id: string;
      name: string | null;
      email: string;
      phone: string | null;
      role: string;
      image: string | null;
      emailVerified: boolean;
      createdAt: Date;
      isSuspended: boolean;
    } | null = null;

    user = await db.user.findFirst({
      where: {
        id: session.userId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        isSuspended: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 },
      );
    }

    if (user.isSuspended) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    let shopkeeperRegistrationStatus: "not_submitted" | "pending" | "approved" | "rejected" = "not_submitted";
    let shopName = "";
    if (String(user.role || "").toLowerCase() === "shopkeeper") {
      const [latestRegistration, latestSettings] = await Promise.all([
        db.authLog.findFirst({
          where: {
            provider: "local",
            mode: "shopkeeper-registration",
            email: user.email,
          },
          orderBy: { createdAt: "desc" },
          select: { status: true, response: true },
        }),
        db.authLog.findFirst({
          where: {
            provider: "local",
            mode: "shopkeeper-settings",
            email: user.email,
            status: "SUCCESS",
          },
          orderBy: { createdAt: "desc" },
          select: { response: true },
        }),
      ]);

      const normalized = String(latestRegistration?.status || "").toLowerCase();
      shopName =
        extractShopNameFromSettings(latestSettings?.response) ||
        extractShopNameFromRegistration(latestRegistration?.response) ||
        String(user.name || "").trim();
      if (normalized === "approved") {
        shopkeeperRegistrationStatus = "approved";
      } else if (normalized === "rejected") {
        shopkeeperRegistrationStatus = "rejected";
      } else if (normalized === "pending") {
        shopkeeperRegistrationStatus = "pending";
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        id: user.id,
        name: user.name || "User",
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        avatar: user.image || "",
        emailVerified: user.emailVerified,
        shopName,
        shopkeeperRegistrationComplete:
          String(user.role || "").toLowerCase() === "shopkeeper"
            ? shopkeeperRegistrationStatus !== "not_submitted"
            : true,
        shopkeeperRegistrationStatus,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get auth session";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session?.userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    let body: { name?: string; phone?: string; email?: string } = {};
    try {
      body = (await request.json()) as { name?: string; phone?: string };
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid payload" },
        { status: 400 },
      );
    }

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const nextEmail =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    const existing = await db.user.findFirst({
      where: {
        id: session.userId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 },
      );
    }

    const emailChanged =
      nextEmail && nextEmail !== String(existing.email || "").toLowerCase();

    if (!name && !phone && !emailChanged) {
      return NextResponse.json(
        { ok: false, error: "No changes provided" },
        { status: 400 },
      );
    }

    if (emailChanged) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(nextEmail)) {
        return NextResponse.json(
          { ok: false, error: "Invalid email format" },
          { status: 400 },
        );
      }

      const existingEmail = await db.user.findFirst({
        where: {
          email: nextEmail,
          id: { not: session.userId },
          deletedAt: null,
        },
        select: { id: true },
      });

      if (existingEmail) {
        return NextResponse.json(
          { ok: false, error: "Email already in use" },
          { status: 409 },
        );
      }
    }

    const updated = await db.user.update({
      where: {
        id: session.userId,
      },
      data: {
        ...(name ? { name } : {}),
        ...(phone ? { phone } : {}),
        ...(emailChanged
          ? {
              email: nextEmail,
              emailVerified: false,
            }
          : {}),
      },
    });

    const response = NextResponse.json({
      ok: true,
      data: {
        id: updated.id,
        name: updated.name || "User",
        email: updated.email,
        phone: updated.phone || "",
        role: updated.role,
        avatar: updated.image || "",
        emailVerified: updated.emailVerified,
        createdAt: updated.createdAt,
      },
    });

    if (emailChanged) {
      response.headers.set(
        "Set-Cookie",
        createSessionCookie({
          userId: updated.id,
          role: updated.role,
          email: updated.email,
        }),
      );
    }

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
