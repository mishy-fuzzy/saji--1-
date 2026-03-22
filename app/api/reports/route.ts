import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { authorizeRoles } from "@/lib/server/rbac"

const prismaDb: any = db

function normalizeScope(input: string | null): "admin" | "subadmin" {
  return String(input || "admin").toLowerCase() === "subadmin" ? "subadmin" : "admin"
}

function safeParseJson(value: string | null) {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const denied = authorizeRoles(request, ["admin", "sub-admin", "subadmin"])
  if (denied) return denied

  try {
    const { searchParams } = new URL(request.url)
    const scope = normalizeScope(searchParams.get("scope"))

    const rows = await prismaDb.authLog.findMany({
      where: {
        provider: "system",
        mode: "report-generated",
        status: "SUCCESS",
        email: scope,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        createdAt: true,
        response: true,
      },
    })

    const reports = rows.map((row: any) => {
      const payload = safeParseJson(row.response) || {}
      return {
        id: row.id,
        name: String(payload.name || "Generated Report"),
        type: String(payload.type || "general"),
        status: "Ready",
        createdBy: String(payload.createdBy || "System"),
        date: new Date(row.createdAt).toLocaleDateString(),
        data: payload.data || {},
      }
    })

    return NextResponse.json({ ok: true, data: reports })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch reports"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const denied = authorizeRoles(request, ["admin", "sub-admin", "subadmin"])
  if (denied) return denied

  try {
    const body = await request.json()
    const scope = normalizeScope(String(body?.scope || "admin"))
    const type = String(body?.type || "general").trim().toLowerCase()

    const [usersCount, providersCount, agentsCount, bookingsCount, pendingCount, completedCount, paymentsSum] =
      await Promise.all([
        prismaDb.user.count({ where: { deletedAt: null } }),
        prismaDb.user.count({ where: { deletedAt: null, role: "provider" } }),
        prismaDb.user.count({ where: { deletedAt: null, role: "agent" } }),
        prismaDb.booking.count(),
        prismaDb.booking.count({ where: { status: "pending" } }),
        prismaDb.booking.count({ where: { status: "completed" } }),
        prismaDb.paymentTransaction.aggregate({
          _sum: { amount: true },
          where: { status: { in: ["SUCCESS", "PENDING"] } },
        }),
      ])

    const payload = {
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Report - ${new Date().toLocaleDateString()}`,
      type,
      createdBy: scope === "admin" ? "Admin" : "Sub-Admin",
      generatedAt: new Date().toISOString(),
      data: {
        usersCount,
        providersCount,
        agentsCount,
        bookingsCount,
        pendingCount,
        completedCount,
        paymentsKES: Number(paymentsSum?._sum?.amount || 0),
      },
    }

    const row = await prismaDb.authLog.create({
      data: {
        provider: "system",
        mode: "report-generated",
        email: scope,
        status: "SUCCESS",
        response: JSON.stringify(payload),
      },
      select: {
        id: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      ok: true,
      data: {
        id: row.id,
        name: payload.name,
        type: payload.type,
        status: "Ready",
        createdBy: payload.createdBy,
        date: new Date(row.createdAt).toLocaleDateString(),
        data: payload.data,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate report"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const denied = authorizeRoles(request, ["admin", "sub-admin", "subadmin"])
  if (denied) return denied

  try {
    const { searchParams } = new URL(request.url)
    const id = String(searchParams.get("id") || "").trim()

    if (!id) {
      return NextResponse.json({ ok: false, error: "report id is required" }, { status: 400 })
    }

    await prismaDb.authLog.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete report"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
