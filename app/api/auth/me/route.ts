import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionFromRequest } from "@/lib/server/session";

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

    try {
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
    } catch {
      user = null;
    }

    if (!user) {
      return NextResponse.json({
        ok: true,
        data: {
          id: session.userId,
          name: "User",
          email: session.email,
          phone: "",
          role: session.role,
          avatar: "",
          shopkeeperRegistrationComplete: false,
          shopkeeperRegistrationStatus: "not_submitted",
          createdAt: new Date(0),
        },
      });
    }

    if (user.isSuspended) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    let shopkeeperRegistrationStatus: "not_submitted" | "pending" | "approved" | "rejected" = "not_submitted";
    if (String(user.role || "").toLowerCase() === "shopkeeper") {
      const latestRegistration = await db.authLog.findFirst({
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
