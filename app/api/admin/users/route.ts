import { NextResponse } from "next/server"
import { fetchMappedUsers } from "@/lib/server/users-api"
import { authorizeRoles } from "@/lib/server/rbac"

export async function GET(request: Request) {
  const denied = authorizeRoles(request, ["admin", "sub-admin", "subadmin"])
  if (denied) return denied

  try {
    const mapped = await fetchMappedUsers()
    return NextResponse.json({ ok: true, data: mapped })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch users"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
