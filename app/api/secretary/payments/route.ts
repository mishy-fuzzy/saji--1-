import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { authorizeRoles } from "@/lib/server/rbac"

const prismaDb: any = db

function mapStatus(value: string): string {
  const normalized = String(value || "pending").toLowerCase()
  if (normalized === "succeeded" || normalized === "success" || normalized === "paid") return "Completed"
  if (normalized === "processing") return "Processing"
  if (normalized === "failed" || normalized === "error") return "Failed"
  return "Pending"
}

export async function GET(request: Request) {
  const denied = authorizeRoles(request, ["secretary", "admin", "sub-admin", "subadmin"])
  if (denied) return denied

  try {
    const rows = await prismaDb.paymentTransaction.findMany({
      include: {
        booking: {
          include: {
            customer: { select: { name: true } },
            provider: { select: { name: true } },
            service: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 250,
    })

    const payments = rows.map((row: any) => {
      const amount = Number(row.amount || 0)
      const fee = Math.round(amount * 0.1)
      const recipient =
        row.booking?.provider?.name ||
        row.booking?.customer?.name ||
        row.booking?.service?.name ||
        String(row.provider || "Payment")

      return {
        id: row.id,
        recipient,
        amount,
        method: row.provider ? String(row.provider).toUpperCase() : "Wallet",
        status: mapStatus(String(row.status || "PENDING")),
        fee,
        reference: String(row.reference || ""),
        description: String(row.kind || row.provider || "Payment transaction"),
        date: new Date(row.createdAt).toLocaleString(),
        createdAt: row.createdAt,
      }
    })

    const totalProcessed = payments.reduce((sum: number, payment: any) => sum + Number(payment.amount || 0), 0)
    const pending = payments.filter((payment: any) => payment.status === "Pending" || payment.status === "Processing").length
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const today = payments
      .filter((payment: any) => new Date(payment.createdAt) >= todayStart)
      .reduce((sum: number, payment: any) => sum + Number(payment.amount || 0), 0)
    const thisMonthStart = new Date()
    thisMonthStart.setDate(1)
    thisMonthStart.setHours(0, 0, 0, 0)
    const thisMonth = payments
      .filter((payment: any) => new Date(payment.createdAt) >= thisMonthStart)
      .reduce((sum: number, payment: any) => sum + Number(payment.amount || 0), 0)

    return NextResponse.json({
      ok: true,
      data: {
        payments,
        stats: {
          totalProcessed,
          pending,
          today,
          thisMonth,
        },
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load payments"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}