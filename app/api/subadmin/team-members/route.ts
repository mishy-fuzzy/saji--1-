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

function roleLabel(role: string): string {
  if (role === "subadmin") return "Sub Admin"
  if (role === "secretary") return "Secretary"
  return "Agent"
}

async function requireManager(request: Request) {
  const { actor, error } = await getSessionActor(request)
  if (error) return { actor: null, error }

  if (!actor || !hasAnyRole(actor, ["admin", "subadmin", "sub-admin"])) {
    return { actor: null, error: NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 }) }
  }

  return { actor, error: null }
}

export async function GET(request: Request) {
  const { error } = await requireManager(request)
  if (error) return error

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
    role: normalizeRole(row.role),
    roleLabel: roleLabel(normalizeRole(row.role)),
    agents: 0,
    status: row.isSuspended ? "Inactive" : "Active",
    joinedDate: new Date(row.createdAt).toISOString().split("T")[0],
  }))

  return NextResponse.json({ ok: true, data })
}

export async function POST(request: Request) {
  const { error } = await requireManager(request)
  if (error) return error

  const body = await request.json()
  const name = String(body?.name || "").trim()
  const email = String(body?.email || "").trim().toLowerCase()
  const role = normalizeRole(body?.role)
  const status = String(body?.status || "Active").trim().toLowerCase()

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
          isSuspended: status !== "active",
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
          isSuspended: status !== "active",
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

  return NextResponse.json({
    ok: true,
    data: {
      id: created.id,
      name: created.name || "Unnamed User",
      email: created.email,
      role: normalizeRole(created.role),
      roleLabel: roleLabel(normalizeRole(created.role)),
      agents: 0,
      status: created.isSuspended ? "Inactive" : "Active",
      joinedDate: new Date(created.createdAt).toISOString().split("T")[0],
    },
    credentials: {
      email: created.email,
      temporaryPassword,
      loginUrl: "/team-login",
    },
  })
}

export async function PATCH(request: Request) {
  const { error } = await requireManager(request)
  if (error) return error

  const body = await request.json()
  const id = String(body?.id || "").trim()
  const name = String(body?.name || "").trim()
  const email = String(body?.email || "").trim().toLowerCase()
  const role = normalizeRole(body?.role)
  const status = String(body?.status || "Active").trim().toLowerCase()

  if (!id) {
    return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 })
  }

  if (!name || !email || !role) {
    return NextResponse.json({ ok: false, error: "name, email and role are required" }, { status: 400 })
  }

  if (!TEAM_ROLES.has(role)) {
    return NextResponse.json({ ok: false, error: "invalid team role" }, { status: 400 })
  }

  const updated = await prismaDb.user.update({
    where: { id },
    data: {
      name,
      email,
      role,
      isSuspended: status !== "active",
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

  return NextResponse.json({
    ok: true,
    data: {
      id: updated.id,
      name: updated.name || "Unnamed User",
      email: updated.email,
      role: normalizeRole(updated.role),
      roleLabel: roleLabel(normalizeRole(updated.role)),
      agents: 0,
      status: updated.isSuspended ? "Inactive" : "Active",
      joinedDate: new Date(updated.createdAt).toISOString().split("T")[0],
    },
  })
}

export async function DELETE(request: Request) {
  const { error } = await requireManager(request)
  if (error) return error

  const body = await request.json()
  const id = String(body?.id || "").trim()

  if (!id) {
    return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 })
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
