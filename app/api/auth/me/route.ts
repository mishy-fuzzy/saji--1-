import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { getSessionFromRequest } from "@/lib/server/session"

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request)
    if (!session?.userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findFirst({
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
    })

    if (!user || user.isSuspended) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
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
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get auth session"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
