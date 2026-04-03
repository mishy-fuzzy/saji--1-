import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { authorizeRoles } from "@/lib/server/rbac"
import { getSessionFromRequest } from "@/lib/server/session"

function safeParse(value: string | null | undefined): Record<string, unknown> {
  if (!value) return {}
  try {
    return JSON.parse(value)
  } catch {
    return {}
  }
}

function toStatus(value: string): "Filed" | "Pending" | "Draft" | "Overdue" {
  const normalized = String(value || "draft").toLowerCase()
  if (normalized === "filed") return "Filed"
  if (normalized === "pending") return "Pending"
  if (normalized === "overdue") return "Overdue"
  return "Draft"
}

function taxForAmount(amount: number): number {
  return Math.round(Math.max(0, amount) * 0.16)
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

export async function GET(request: Request) {
  const denied = authorizeRoles(request, ["secretary", "admin", "sub-admin", "subadmin"])
  if (denied) return denied

  try {
    const [generatedRows, txRows] = await Promise.all([
      db.authLog.findMany({
        where: {
          provider: "local",
          mode: "secretary-tax-report",
          status: { in: ["SUCCESS", "PENDING", "DRAFT", "OVERDUE", "FILED"] },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      db.paymentTransaction.findMany({
        where: {
          status: { in: ["SUCCESS", "COMPLETED", "PAID", "PENDING"] },
        },
        orderBy: { createdAt: "desc" },
        take: 1000,
        select: {
          amount: true,
          createdAt: true,
          status: true,
          provider: true,
        },
      }),
    ])

    const reportsFromDb = generatedRows.map((row: any) => {
      const payload = safeParse(row.response)
      return {
        id: String(row.id),
        period: String(payload.period || monthLabel(new Date(row.createdAt))),
        type: String(payload.type || "Monthly VAT"),
        status: toStatus(String(payload.status || row.status || "Draft")),
        dueDate: String(payload.dueDate || "TBD"),
        filedDate: String(payload.filedDate || "-"),
        amount: String(payload.amount || "KES 0"),
        taxDue: String(payload.taxDue || "KES 0"),
      }
    })

    const monthly = new Map<string, { amount: number; taxDue: number; txCount: number }>()
    for (const tx of txRows as any[]) {
      const date = new Date(tx.createdAt)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const current = monthly.get(key) || { amount: 0, taxDue: 0, txCount: 0 }
      const amount = Number(tx.amount || 0)
      current.amount += amount
      current.taxDue += taxForAmount(amount)
      current.txCount += 1
      monthly.set(key, current)
    }

    const derivedReports = Array.from(monthly.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 6)
      .map(([key, value], index) => {
        const [year, month] = key.split("-")
        const date = new Date(Number(year), Number(month) - 1, 1)
        return {
          id: `AUTO-${key}`,
          period: monthLabel(date),
          type: "Monthly VAT",
          status: index === 0 ? "Pending" : "Filed",
          dueDate: new Date(Number(year), Number(month), 9).toISOString().slice(0, 10),
          filedDate: index === 0 ? "-" : new Date(Number(year), Number(month), 3).toISOString().slice(0, 10),
          amount: `KES ${Math.round(value.amount).toLocaleString()}`,
          taxDue: `KES ${Math.round(value.taxDue).toLocaleString()}`,
        }
      })

    const mergedById = new Map<string, any>()
    for (const row of [...reportsFromDb, ...derivedReports]) {
      if (!mergedById.has(row.id)) mergedById.set(row.id, row)
    }

    const reports = Array.from(mergedById.values())

    const totalFiledTax = reports
      .filter((row) => row.status === "Filed")
      .reduce((sum, row) => sum + Number(String(row.taxDue || "0").replace(/[^\d.-]/g, "") || 0), 0)

    const pendingFilings = reports.filter((row) => row.status === "Pending" || row.status === "Overdue").length

    const nextDeadline = reports
      .filter((row) => row.dueDate && row.dueDate !== "TBD")
      .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))[0]

    const complianceScore = reports.length
      ? Math.round((reports.filter((row) => row.status === "Filed").length / reports.length) * 100)
      : 0

    return NextResponse.json({
      ok: true,
      data: {
        reports,
        summary: [
          { label: "Total Tax Filed (YTD)", value: `KES ${Math.round(totalFiledTax).toLocaleString()}`, change: "Live" },
          { label: "Pending Filings", value: String(pendingFilings), change: pendingFilings > 0 ? "Action needed" : "On track" },
          { label: "Next Deadline", value: nextDeadline?.dueDate || "N/A", change: nextDeadline ? "Upcoming" : "No pending" },
          { label: "Compliance Score", value: `${complianceScore}%`, change: "Live" },
        ],
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load tax reports"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const denied = authorizeRoles(request, ["secretary", "admin", "sub-admin", "subadmin"])
  if (denied) return denied

  const session = getSessionFromRequest(request)

  try {
    const body = await request.json().catch(() => ({}))
    const now = new Date()
    const type = String(body?.type || "Monthly VAT")
    const period = String(body?.period || monthLabel(now))
    const dueDate = String(body?.dueDate || new Date(now.getFullYear(), now.getMonth() + 1, 9).toISOString().slice(0, 10))

    const created = await db.authLog.create({
      data: {
        provider: "local",
        mode: "secretary-tax-report",
        email: session?.email || "system@saji.local",
        status: "DRAFT",
        response: JSON.stringify({
          type,
          period,
          status: "Draft",
          dueDate,
          filedDate: "-",
          amount: "KES 0",
          taxDue: "KES 0",
          createdAt: now.toISOString(),
        }),
      },
      select: {
        id: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      ok: true,
      data: {
        id: created.id,
        period,
        type,
        status: "Draft",
        dueDate,
        filedDate: "-",
        amount: "KES 0",
        taxDue: "KES 0",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate tax report"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
