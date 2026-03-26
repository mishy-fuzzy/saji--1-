import { NextResponse } from "next/server"
import { compare } from "bcryptjs"
import type { User, UserRole } from "@/lib/types"
import { db } from "@/lib/server/db"
import { setSessionCookie } from "@/lib/server/session"

type LoginBody = {
  email?: string
  phone?: string
  password?: string
}

function mapDbRole(role: string): UserRole {
  if (role === "sub_admin") return "sub-admin"
  if (role === "shopkeeper") return "provider"
  return role as UserRole
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody
    const email = String(body.email || "").toLowerCase().trim()
    const phone = String(body.phone || "").trim()
    const password = String(body.password || "")

    if (!password || (!email && !phone)) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 })
    }

    const record = await db.user.findFirst({
      where: email
        ? {
            email: {
              equals: email,
              mode: "insensitive",
            },
          }
        : {
            phone,
          },
    })

    if (!record?.passwordHash) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const isValid = await compare(password, record.passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const routeRole = record.role === "shopkeeper" ? "shopkeeper" : mapDbRole(record.role)

    const user: User = {
      id: record.id,
      name: record.name,
      email: record.email,
      phone: record.phone || "",
      role: mapDbRole(record.role),
      createdAt: record.createdAt.toISOString(),
      avatar: record.avatar || undefined,
    }

    const response = NextResponse.json({ ok: true, user, routeRole })
    setSessionCookie(response, user)
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
