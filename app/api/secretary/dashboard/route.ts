import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth"

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function normalizePaymentStatus(status: string): "Completed" | "Processing" {
  const value = String(status || "").toUpperCase()
  return value === "SUCCESS" || value === "SUCCEEDED" ? "Completed" : "Processing"
}

export async function GET(request: Request) {
  const { actor, error } = await getSessionActor(request)
  if (error) return error

  if (!actor || !hasAnyRole(actor, ["secretary"])) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
  }

  const payments = await db.paymentTransaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
    select: {
      id: true,
      provider: true,
      amount: true,
      currency: true,
      status: true,
      kind: true,
      createdAt: true,
    },
  })

  const recentTransactions = payments.slice(0, 25).map((row: any) => ({
    id: row.id.slice(0, 10),
    description: `${row.kind || "Transaction"} via ${row.provider || "gateway"}`,
    amount: `${row.currency || "KES"} ${(row.amount || 0).toLocaleString()}`,
    status: normalizePaymentStatus(row.status),
    date: formatDate(row.createdAt),
    method: row.provider || "System",
  }))

  const byProvider: Record<string, { total: number; latest: Date; hasPending: boolean }> = {}
  for (const row of payments) {
    const key = String(row.provider || "system")
    if (!byProvider[key]) {
      byProvider[key] = {
        total: 0,
        latest: row.createdAt,
        hasPending: false,
      }
    }
    byProvider[key].total += row.amount || 0
    if (row.createdAt.getTime() > byProvider[key].latest.getTime()) {
      byProvider[key].latest = row.createdAt
    }
    if (normalizePaymentStatus(row.status) === "Processing") {
      byProvider[key].hasPending = true
    }
  }

  const reconciliationStatus = Object.entries(byProvider).map(([provider, info]) => ({
    account: `${provider.toUpperCase()} Settlement`,
    balance: `KES ${info.total.toLocaleString()}`,
    lastReconciled: formatDate(info.latest),
    status: info.hasPending ? "In Progress" : "Reconciled",
  }))

  const completed = recentTransactions.filter((row) => row.status === "Completed").length
  const processing = recentTransactions.filter((row) => row.status === "Processing").length
  const totalAmount = payments.reduce((sum, row) => sum + (row.amount || 0), 0)
  const thisMonthEstimate = Math.round(totalAmount / Math.max(1, 4))
  const totalTransactions = payments.length

  return NextResponse.json({
    ok: true,
    data: {
      stats: {
        totalProcessed: totalAmount,
        pending: processing,
        completed,
        thisMonthEstimate,
      },
      totals: {
        totalTransactions,
        processingTransactions: processing,
      },
      recentTransactions,
      reconciliationStatus,
    },
  })
}
