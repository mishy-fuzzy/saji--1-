import { NextResponse } from "next/server"
import { fetchMappedUsers } from "@/lib/server/users-api"
import { authorizeRoles } from "@/lib/server/rbac"

// Secretary view: finance and reconciliation often require visibility across all users.
export async function GET(request: Request) {
  const denied = authorizeRoles(request, ["secretary", "admin", "sub-admin", "subadmin"])
  if (denied) return denied

  try {
    const data = await fetchMappedUsers()
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch secretary users"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
