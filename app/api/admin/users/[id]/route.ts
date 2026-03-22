import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { authorizeRoles } from "@/lib/server/rbac"

const prismaDb: any = db

async function writeAuditLog(params: {
  email?: string
  mode: string
  status: "SUCCESS" | "FAILED"
  response?: unknown
  error?: string
}) {
  try {
    await prismaDb.authLog.create({
      data: {
        provider: "admin",
        mode: params.mode,
        email: params.email,
        status: params.status,
        response: params.response ? JSON.stringify(params.response) : undefined,
        error: params.error,
      },
    })
  } catch {
    // Do not fail the parent request when audit logging fails.
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = authorizeRoles(request, ["admin", "sub-admin", "subadmin"])
  if (denied) return denied

  const { id } = await context.params

  try {
    const body = await request.json()

    const name = body?.name ? String(body.name).trim() : undefined
    const phone = body?.phone ? String(body.phone).trim() : undefined
    const role = body?.role ? String(body.role).trim().toLowerCase() : undefined
    const status = body?.status ? String(body.status).trim().toLowerCase() : undefined

    const allowedRoles = new Set(["customer", "provider", "admin", "agent", "secretary", "shopkeeper", "subadmin"])

    if (role && !allowedRoles.has(role)) {
      return NextResponse.json({ ok: false, error: "Invalid role" }, { status: 400 })
    }

    const isSuspended = status ? status === "suspended" : undefined

    const updated = await prismaDb.user.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(phone ? { phone } : {}),
        ...(role ? { role } : {}),
        ...(typeof isSuspended === "boolean" ? { isSuspended } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isSuspended: true,
        updatedAt: true,
      },
    })

    await writeAuditLog({
      email: updated.email,
      mode: "admin-user-patch",
      status: "SUCCESS",
      response: {
        targetUserId: updated.id,
        role: updated.role,
        isSuspended: updated.isSuspended,
      },
    })

    return NextResponse.json({ ok: true, data: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update user"
    await writeAuditLog({ mode: "admin-user-patch", status: "FAILED", error: message })
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = authorizeRoles(request, ["admin", "sub-admin", "subadmin"])
  if (denied) return denied

  const { id } = await context.params

  try {
    const existing = await prismaDb.user.findUnique({
      where: { id },
      select: { id: true, email: true, deletedAt: true },
    })

    if (!existing) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 })
    }

    if (existing.deletedAt) {
      return NextResponse.json({ ok: true, data: { id: existing.id, alreadyDeleted: true } })
    }

    const [localPart, domainPart] = existing.email.split("@")
    const nextEmail = domainPart
      ? `${localPart}.deleted.${Date.now()}@${domainPart}`
      : `${existing.email}.deleted.${Date.now()}`

    const deleted = await prismaDb.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isSuspended: true,
        email: nextEmail,
      },
      select: {
        id: true,
        email: true,
        deletedAt: true,
      },
    })

    await writeAuditLog({
      email: existing.email,
      mode: "admin-user-delete",
      status: "SUCCESS",
      response: {
        targetUserId: deleted.id,
        deletedAt: deleted.deletedAt,
      },
    })

    return NextResponse.json({ ok: true, data: deleted })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete user"
    await writeAuditLog({ mode: "admin-user-delete", status: "FAILED", error: message })
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
