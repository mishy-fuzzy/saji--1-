import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { authorizeRoles } from "@/lib/server/rbac"

const prismaDb: any = db

function toUiStatus(status: string): "Pending" | "Reconciled" | "Under Review" {
  const normalized = String(status || "pending").toLowerCase()
  if (normalized === "success" || normalized === "completed") return "Reconciled"
  if (normalized === "failed" || normalized === "error") return "Under Review"
  return "Pending"
}

function formatMoney(amount: number): string {
  return `KES ${Math.abs(Math.round(amount)).toLocaleString()}`
}

export async function GET(request: Request) {
  const denied = authorizeRoles(request, ["secretary", "admin", "sub-admin", "subadmin"])
  if (denied) return denied

  try {
    const transactions = await prismaDb.paymentTransaction.findMany({
      where: {
        provider: { in: ["wallet", "mpesa", "bank", "card", "paypal", "invoice"] },
      },
      orderBy: { createdAt: "desc" },
      take: 250,
    })

    const reconciliations = transactions.map((row: any, index: number) => {
      const amount = Number(row.amount || 0)
      const variance = String(row.status || "").toUpperCase() === "FAILED" ? amount : 0
      return {
        id: row.id,
        date: new Date(row.createdAt).toISOString().slice(0, 10),
        account: `${String(row.provider || "payment").toUpperCase()}-${String(index + 1).padStart(3, "0")}`,
        systemBalance: formatMoney(amount),
        bankBalance: formatMoney(amount - variance),
        variance: formatMoney(variance),
        status: toUiStatus(String(row.status || "PENDING")),
      }
    })

    const discrepancies = transactions
      .filter((row: any) => String(row.status || "").toUpperCase() === "FAILED" || String(row.status || "").toUpperCase() === "ERROR")
      .slice(0, 50)
      .map((row: any) => ({
        id: row.id,
        date: new Date(row.createdAt).toISOString().slice(0, 10),
        description: `${String(row.provider || "payment").toUpperCase()} transaction failed`,
        amount: formatMoney(row.amount || 0),
        status: "Open",
        resolution: row.error || "Review payment status and retry if necessary",
      }))

    const systemBalance = transactions.reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0)
    const bankBalance = transactions.reduce((sum: number, row: any) => {
      if (String(row.status || "").toUpperCase() === "FAILED") return sum
      return sum + Number(row.amount || 0)
    }, 0)
    const totalVariance = systemBalance - bankBalance
    const reconciledCount = transactions.filter((row: any) => String(row.status || "").toUpperCase() === "SUCCESS" || String(row.status || "").toUpperCase() === "COMPLETED").length
    const reconciledPercentage = transactions.length > 0 ? Math.round((reconciledCount / transactions.length) * 100) : 0

    const reconciliationData = transactions.slice(0, 100).map((row: any) => ({
      type: Number(row.amount || 0) >= 0 ? "in" : "out",
      description: `${String(row.provider || "payment").toUpperCase()} ${String(row.kind || "transaction")}`,
      date: new Date(row.createdAt).toLocaleString(),
      amount: formatMoney(row.amount || 0),
    }))

    return NextResponse.json({
      ok: true,
      data: {
        reconciliations,
        discrepancies,
        reconciliationData,
        stats: {
          systemBalance: formatMoney(systemBalance),
          bankBalance: formatMoney(bankBalance),
          totalVariance: formatMoney(totalVariance),
          reconciledPercentage: `${reconciledPercentage}%`,
        },
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load reconciliation data"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}