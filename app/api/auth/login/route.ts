import { NextResponse } from "next/server"
import type { User, UserRole } from "@/lib/types"
import { setSessionCookie } from "@/lib/server/session"

type LoginBody = {
  email?: string
  phone?: string
  password?: string
}

function getRoleFromCredentials(body: LoginBody): UserRole | "shopkeeper" {
  const email = String(body.email || "").toLowerCase().trim()
  const phone = String(body.phone || "").trim()
  const password = String(body.password || "")

  if (email === "admin@gmail.com" && password === "Admin@123") return "admin"
  if (email === "secretary@gmail.com" && password === "Secretary@123") return "secretary"
  if (email === "subadmin@gmail.com" && password === "SubAdmin@123") return "sub-admin"

  const identifier = email || phone
  if (identifier.includes("provider")) return "provider"
  if (identifier.includes("shopkeeper")) return "shopkeeper"
  return "customer"
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody
    const password = String(body.password || "")

    if (!password || (!body.email && !body.phone)) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 })
    }

    const role = getRoleFromCredentials(body)
    const nameFromEmail = body.email ? String(body.email).split("@")[0] : "User"

    const user: User = {
      id: `user_${Date.now()}`,
      name: nameFromEmail,
      email: String(body.email || "user@example.com"),
      phone: String(body.phone || "+254700000000"),
      role: (role === "shopkeeper" ? "provider" : role) as UserRole,
      createdAt: new Date().toISOString(),
    }

    const response = NextResponse.json({ ok: true, user, routeRole: role })
    setSessionCookie(response, user)
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
