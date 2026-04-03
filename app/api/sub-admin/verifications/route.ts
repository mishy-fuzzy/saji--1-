import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { authorizeRoles } from "@/lib/server/rbac"

function toUiStatus(value: string): "Pending" | "Approved" | "Rejected" {
  const normalized = String(value || "pending").toLowerCase()
  if (normalized === "approved") return "Approved"
  if (normalized === "rejected") return "Rejected"
  return "Pending"
}

function toDbStatus(value: string): "pending" | "approved" | "rejected" {
  const normalized = String(value || "pending").toLowerCase()
  if (normalized === "approved") return "approved"
  if (normalized === "rejected") return "rejected"
  return "pending"
}

export async function GET(request: Request) {
  const denied = authorizeRoles(request, ["sub-admin", "subadmin", "admin"])
  if (denied) return denied

  try {
    const rows = await db.verification.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      take: 300,
    })

    const data = rows.map((row: any) => ({
      id: row.id,
      userId: row.userId,
      name: String(row.user?.name || "Unnamed User"),
      role: String(row.user?.role || "user"),
      documents: String(row.documentUrl || "No document uploaded"),
      status: toUiStatus(String(row.status || "pending")),
      notes: String(row.notes || ""),
      date: new Date(row.createdAt).toISOString().slice(0, 10),
    }))

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch verifications"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const denied = authorizeRoles(request, ["sub-admin", "subadmin", "admin"])
  if (denied) return denied

  try {
    const body = await request.json()
    const verificationId = String(body?.verificationId || "").trim()
    const status = toDbStatus(String(body?.status || ""))
    const notes = String(body?.notes || "").trim()

    if (!verificationId) {
      return NextResponse.json(
        { ok: false, error: "verificationId is required" },
        { status: 400 },
      )
    }

    const updated = await db.verification.update({
      where: { id: verificationId },
      data: {
        status,
        notes: notes || undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    })

    return NextResponse.json({
      ok: true,
      data: {
        id: updated.id,
        userId: updated.userId,
        name: String(updated.user?.name || "Unnamed User"),
        role: String(updated.user?.role || "user"),
        documents: String(updated.documentUrl || "No document uploaded"),
        status: toUiStatus(String(updated.status || "pending")),
        notes: String(updated.notes || ""),
        date: new Date(updated.createdAt).toISOString().slice(0, 10),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update verification"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
