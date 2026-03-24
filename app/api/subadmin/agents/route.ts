import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth"

const prismaDb: any = db

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
      role: "agent",
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isSuspended: true,
      createdAt: true,
    },
  })

  const data = rows.map((row: any) => ({
    id: row.id,
    name: row.name || "Unnamed Agent",
    email: row.email,
    phone: row.phone || "",
    status: row.isSuspended ? "Inactive" : "Active",
    joined: new Date(row.createdAt).toISOString().split("T")[0],
    performance: "N/A",
    commission: "10%",
  }))

  return NextResponse.json({ ok: true, data })
}

export async function PATCH(request: Request) {
  const { error } = await requireManager(request)
  if (error) return error

  const body = await request.json()
  const id = String(body?.id || "").trim()
  const name = String(body?.name || "").trim()
  const email = String(body?.email || "").trim().toLowerCase()
  const phone = String(body?.phone || "").trim()
  const status = String(body?.status || "Active").trim().toLowerCase()

  if (!id || !name || !email) {
    return NextResponse.json({ ok: false, error: "id, name and email are required" }, { status: 400 })
  }

  const updated = await prismaDb.user.update({
    where: { id },
    data: {
      name,
      email,
      phone,
      isSuspended: status !== "active",
      role: "agent",
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isSuspended: true,
      createdAt: true,
    },
  })

  return NextResponse.json({
    ok: true,
    data: {
      id: updated.id,
      name: updated.name || "Unnamed Agent",
      email: updated.email,
      phone: updated.phone || "",
      status: updated.isSuspended ? "Inactive" : "Active",
      joined: new Date(updated.createdAt).toISOString().split("T")[0],
      performance: "N/A",
      commission: "10%",
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
