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

    return NextResponse.json({
      ok: true,
      data: {
        id: user.id,
        name: user.name || "User",
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get auth session";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
