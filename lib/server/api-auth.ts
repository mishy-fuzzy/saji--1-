import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { getSessionFromRequest } from "@/lib/server/session"

export type SessionActor = {
  id: string
  email: string
  role: string
  name: string
}

function normalizeRole(role: string | null | undefined): string {
  return String(role || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
}

export async function getSessionActor(request: Request): Promise<{
  actor: SessionActor | null
  error: NextResponse | null
}> {
  const session = getSessionFromRequest(request)
  if (!session?.userId) {
    return {
      actor: null,
      error: NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }),
    }
  }

  const user = await db.user.findFirst({
    where: { id: session.userId, deletedAt: null },
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
    },
  })

  if (!user) {
    return {
      actor: null,
      error: NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }),
    }
  }

  return {
    actor: {
      id: user.id,
      email: user.email,
      role: normalizeRole(user.role || session.role),
      name: user.name || "User",
    },
    error: null,
  }
}

export function hasAnyRole(actor: SessionActor, allowed: string[]): boolean {
  const normalized = allowed.map((role) => normalizeRole(role))
  return normalized.includes(actor.role)
}
