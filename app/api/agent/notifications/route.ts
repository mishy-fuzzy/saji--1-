import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { getSessionCookieName, verifySessionToken } from "@/lib/server/session"
import { mapAuthLogToNotification } from "@/lib/server/in-app-notifications"

function relativeTime(when: Date): string {
  const diffMs = Date.now() - when.getTime()
  const mins = Math.max(1, Math.floor(diffMs / 60000))
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value
  const sessionUser = token ? verifySessionToken(token) : null

  if (!sessionUser) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { email: sessionUser.email },
    select: { id: true, role: true },
  })

  if (!user || user.role !== "agent") {
    return NextResponse.json({ ok: false, error: "Agent account not found" }, { status: 404 })
  }

  const [assignedDisputes, recentPayments, authRows] = await Promise.all([
    db.dispute.findMany({
      where: { assignedToId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, reason: true, createdAt: true },
    }),
    db.paymentTransaction.findMany({
      where: { status: { in: ["PENDING", "SUCCESS", "SUCCEEDED"] } },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { amount: true, currency: true, createdAt: true },
    }),
    db.authLog.findMany({
      where: {
        provider: "system",
        mode: "notification",
        status: "SUCCESS",
        email: user.id,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, response: true, createdAt: true },
    }),
  ])

  const authNotifications = authRows.map((row: any) => {
    const item = mapAuthLogToNotification(row)
    return {
      id: row.id,
      text: item.title || item.message || "Notification",
      createdAt: row.createdAt,
    }
  })

  const disputeNotifications = assignedDisputes.map((item: any) => ({
    id: `d-${item.id}`,
    text: `New dispute ${item.id.slice(0, 8)} assigned to you`,
    createdAt: item.createdAt,
  }))

  const paymentNotifications = recentPayments.map((p: any, idx: number) => ({
    id: `p-${idx}-${p.createdAt.getTime()}`,
    text: `Commission-related payment update: ${(p.currency || "KES")} ${(p.amount || 0).toLocaleString()}`,
    createdAt: p.createdAt,
  }))

  const notifications = [...authNotifications, ...disputeNotifications, ...paymentNotifications]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6)
    .map((item) => ({
      id: item.id,
      text: item.text,
      time: relativeTime(item.createdAt),
    }))

  return NextResponse.json({ ok: true, notifications })
}
