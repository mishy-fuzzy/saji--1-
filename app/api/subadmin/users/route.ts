import { NextResponse } from "next/server"
import { fetchMappedUsers } from "@/lib/server/users-api"
import { authorizeRoles } from "@/lib/server/rbac"

// Alias route for projects that use /subadmin path instead of /sub-admin.
export async function GET(request: Request) {
  const denied = authorizeRoles(request, ["sub-admin", "subadmin", "admin"])
  if (denied) return denied

  try {
    const data = await fetchMappedUsers(["customer", "provider", "shopkeeper", "agent", "secretary", "subadmin"])
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch subadmin users"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
