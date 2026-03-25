import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { authorizeRoles } from "@/lib/server/rbac"

export async function GET(request: Request) {
  const denied = authorizeRoles(request, ["admin", "sub-admin", "subadmin"])
  if (denied) return denied

  try {
    const [userCount, jobCount, disputeCount, totalRevenue, pendingJobs] = await Promise.all([
      db.user.count({ where: { deletedAt: null } }),
      db.booking.count(),
      db.booking.count({ where: { status: { in: ["disputed", "cancelled"] } } }),
      db.booking.aggregate({
        where: { status: "completed" },
        _sum: { amount: true }
      }),
      db.booking.count({ where: { status: "pending" } })
    ])

    return NextResponse.json({ 
      ok: true, 
      count: userCount,
      users: userCount,
      jobs: jobCount,
      disputes: disputeCount,
      revenue: totalRevenue._sum.amount || 0,
      pending: pendingJobs
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch stats"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
