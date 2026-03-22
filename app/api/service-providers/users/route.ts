import { NextResponse } from "next/server"
import { fetchMappedUsers } from "@/lib/server/users-api"
import { authorizeRoles } from "@/lib/server/rbac"

// Service providers API: provider role records.
export async function GET(request: Request) {
  const denied = authorizeRoles(request, ["provider", "admin", "sub-admin", "subadmin"])
  if (denied) return denied

  try {
    const data = await fetchMappedUsers(["provider"])
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch service providers"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
