import { NextResponse } from "next/server"
import { fetchMappedUsers } from "@/lib/server/users-api"
import { authorizeRoles } from "@/lib/server/rbac"

// Provider API alias for service provider records.
export async function GET(request: Request) {
  const denied = authorizeRoles(request, ["provider", "admin", "sub-admin", "subadmin"])
  if (denied) return denied

  try {
    const data = await fetchMappedUsers(["provider"])
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch provider users"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
