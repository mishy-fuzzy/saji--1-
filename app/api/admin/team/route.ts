import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { db } from "@/lib/server/db"

type TeamRole = "sub-admin" | "secretary" | "agent"

type TeamPostBody = {
  name?: string
  email?: string
  role?: TeamRole
  password?: string
}

function toDbRole(role: TeamRole): "sub_admin" | "secretary" | "agent" {
  if (role === "sub-admin") return "sub_admin"
  return role
}

function randomPassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%"
  let value = ""
  for (let i = 0; i < length; i += 1) {
    value += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return value
}

export async function GET() {
  const members = await db.user.findMany({
    where: {
      role: {
        in: ["sub_admin", "secretary", "agent"],
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    take: 200,
  })

  const payload = members.map((member: any) => ({
    id: member.id,
    name: member.name,
    email: member.email,
    role: member.role === "sub_admin" ? "sub-admin" : member.role,
    status: "active",
    joinedDate: member.createdAt.toISOString().split("T")[0],
  }))

  return NextResponse.json({ ok: true, members: payload })
}

export async function POST(request: Request) {
  const body = (await request.json()) as TeamPostBody
  const name = String(body.name || "").trim()
  const email = String(body.email || "").trim().toLowerCase()

  if (!name || !email || !body.role) {
    return NextResponse.json({ ok: false, error: "name, email and role are required" }, { status: 400 })
  }

  const temporaryPassword = body.password || randomPassword()
  const passwordHash = await hash(temporaryPassword, 12)

  const member = await db.user.upsert({
    where: { email },
    update: {
      name,
      role: toDbRole(body.role),
      passwordHash,
    },
    create: {
      name,
      email,
      role: toDbRole(body.role),
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  })

  return NextResponse.json(
    {
      ok: true,
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role === "sub_admin" ? "sub-admin" : member.role,
        status: "active",
        joinedDate: member.createdAt.toISOString().split("T")[0],
      },
      temporaryPassword,
    },
    { status: 201 },
  )
}
