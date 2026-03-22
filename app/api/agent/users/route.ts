import { NextResponse } from "next/server"
import { fetchMappedUsers } from "@/lib/server/users-api"
import { authorizeRoles } from "@/lib/server/rbac"

// Agent view: operational focus on customers and providers, with agent accounts included.
export async function GET(request: Request) {
  const denied = authorizeRoles(request, ["agent", "admin", "sub-admin", "subadmin"])
  if (denied) return denied

  try {
    const data = await fetchMappedUsers(["customer", "provider", "agent"])
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch agent users"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
