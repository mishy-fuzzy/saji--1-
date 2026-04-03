import { NextResponse } from "next/server"
import { getSessionFromRequest } from "@/lib/server/session"

function normalizeRole(role: string | null | undefined): string {
  return String(role || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
}

function getRequestRole(request: Request): string {
  const session = getSessionFromRequest(request)
  if (session?.role) {
    return normalizeRole(session.role)
  }

  return normalizeRole(request.headers.get("x-user-role"))
}

export function authorizeRoles(request: Request, allowedRoles: string[]) {
  const session = getSessionFromRequest(request)
  if (!session?.userId) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    )
  }

  const role = getRequestRole(request)
  const normalizedAllowed = allowedRoles.map((r) => normalizeRole(r))

  if (!normalizedAllowed.includes(role)) {
    return NextResponse.json(
      { ok: false, error: "Forbidden: insufficient role permissions" },
      { status: 403 },
    )
  }

  return null
}
