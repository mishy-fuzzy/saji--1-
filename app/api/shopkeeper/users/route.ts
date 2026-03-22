import { NextResponse } from "next/server"
import { fetchMappedUsers } from "@/lib/server/users-api"
import { authorizeRoles } from "@/lib/server/rbac"

// Shopkeeper view: customer + shopkeeper records for marketplace interactions.
export async function GET(request: Request) {
  const denied = authorizeRoles(request, ["shopkeeper", "admin", "sub-admin", "subadmin"])
  if (denied) return denied

  try {
    const data = await fetchMappedUsers(["customer", "shopkeeper"])
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch shopkeeper users"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
