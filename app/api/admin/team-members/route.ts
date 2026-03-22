import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { db } from "@/lib/server/db"
import { hashPassword } from "@/lib/server/password"
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth"

const prismaDb: any = db

const TEAM_ROLES = new Set(["subadmin", "secretary", "agent"])

function normalizeRole(value: string | null | undefined): string {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")

  if (normalized === "sub-admin") return "subadmin"
  if (normalized === "subadmin") return "subadmin"
  return normalized
}

function createTemporaryPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%"
  let generated = ""
  const bytes = randomBytes(12)
  for (let i = 0; i < 12; i += 1) {
    generated += alphabet[bytes[i] % alphabet.length]
  }
  return generated
}

function mapTeamRoleForUi(role: string): "sub-admin" | "secretary" | "agent" {
  if (role === "subadmin") return "sub-admin"
  if (role === "secretary") return "secretary"
  return "agent"
}

export async function GET(request: Request) {
  const { actor, error } = await getSessionActor(request)
  if (error) return error
  if (!actor || !hasAnyRole(actor, ["admin"])) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
  }

  const rows = await prismaDb.user.findMany({
    where: {
      deletedAt: null,
      role: { in: Array.from(TEAM_ROLES) },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isSuspended: true,
      createdAt: true,
    },
  })

  const data = rows.map((row: any) => ({
    id: row.id,
    name: row.name || "Unnamed User",
    email: row.email,
    role: mapTeamRoleForUi(String(row.role || "")),
    status: row.isSuspended ? "inactive" : "active",
    joinedDate: new Date(row.createdAt).toISOString().split("T")[0],
    credentialsSent: true,
  }))

  return NextResponse.json({ ok: true, data })
}

export async function POST(request: Request) {
  const { actor, error } = await getSessionActor(request)
  if (error) return error
  if (!actor || !hasAnyRole(actor, ["admin"])) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const name = String(body?.name || "").trim()
  const email = String(body?.email || "").trim().toLowerCase()
  const role = normalizeRole(body?.role)

  if (!name || !email || !role) {
    return NextResponse.json({ ok: false, error: "name, email and role are required" }, { status: 400 })
  }

  if (!TEAM_ROLES.has(role)) {
    return NextResponse.json({ ok: false, error: "invalid team role" }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ ok: false, error: "invalid email format" }, { status: 400 })
  }

  const existing = await prismaDb.user.findUnique({ where: { email } })
  if (existing && !existing.deletedAt) {
    return NextResponse.json({ ok: false, error: "An account with this email already exists" }, { status: 409 })
  }

  const temporaryPassword = createTemporaryPassword()
  const passwordHash = hashPassword(temporaryPassword)

  const created = existing
    ? await prismaDb.user.update({
        where: { email },
        data: {
          name,
          role,
          passwordHash,
          isSuspended: false,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isSuspended: true,
          createdAt: true,
        },
      })
    : await prismaDb.user.create({
        data: {
          name,
          email,
          role,
          passwordHash,
          isSuspended: false,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isSuspended: true,
          createdAt: true,
        },
      })

  if (role === "secretary") {
    await prismaDb.secretary.upsert({
      where: { userId: created.id },
      update: {},
      create: { userId: created.id },
    })
  }

  if (role === "agent") {
    await prismaDb.agent.upsert({
      where: { userId: created.id },
      update: {},
      create: { userId: created.id },
    })
  }

  await prismaDb.authLog.create({
    data: {
      provider: "local",
      mode: "admin-team-create",
      email: created.email,
      status: "SUCCESS",
      response: JSON.stringify({ by: actor.email, role: created.role }),
    },
  })

  return NextResponse.json({
    ok: true,
    data: {
      id: created.id,
      name: created.name || "Unnamed User",
      email: created.email,
      role: mapTeamRoleForUi(String(created.role || "")),
      status: created.isSuspended ? "inactive" : "active",
      joinedDate: new Date(created.createdAt).toISOString().split("T")[0],
      credentialsSent: false,
    },
    credentials: {
      email: created.email,
      temporaryPassword,
      loginUrl: "/team-login",
    },
  })
}

export async function DELETE(request: Request) {
  const { actor, error } = await getSessionActor(request)
  if (error) return error
  if (!actor || !hasAnyRole(actor, ["admin"])) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = String(searchParams.get("id") || "").trim()
  if (!id) {
    return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 })
  }

  const existing = await prismaDb.user.findUnique({
    where: { id },
    select: { id: true, role: true, deletedAt: true },
  })

  if (!existing || existing.deletedAt) {
    return NextResponse.json({ ok: false, error: "Team member not found" }, { status: 404 })
  }

  if (!TEAM_ROLES.has(normalizeRole(existing.role))) {
    return NextResponse.json({ ok: false, error: "Only team members can be removed from this screen" }, { status: 400 })
  }

  await prismaDb.user.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isSuspended: true,
    },
  })

  return NextResponse.json({ ok: true })
}
