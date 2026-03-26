import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"

function relativeTime(when: Date): string {
  const diffMs = Date.now() - when.getTime()
  const mins = Math.max(1, Math.floor(diffMs / 60000))
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export async function GET() {
  const [
    users,
    jobs,
    disputes,
    payments,
    recentUsers,
    recentJobs,
    recentDisputes,
    providers,
    completedProviderJobs,
  ] = await Promise.all([
    db.user.count(),
    db.job.findMany({
      select: { status: true, price: true, providerId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    db.dispute.findMany({
      select: { reason: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    db.paymentTransaction.findMany({
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    db.user.findMany({
      select: { name: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    db.job.findMany({
      select: { title: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    db.dispute.findMany({
      select: { reason: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    db.user.findMany({
      where: { role: "provider" },
      select: { id: true, name: true },
      take: 20,
    }),
    db.job.findMany({
      where: { status: "completed", providerId: { not: null } },
      select: { providerId: true, price: true },
    }),
  ])

  const activeJobs = jobs.filter((job: any) => ["pending", "accepted", "in_progress"].includes(job.status)).length
  const completedTasks = jobs.filter((job: any) => job.status === "completed").length
  const openDisputes = disputes.filter((d: any) => d.status === "open" || d.status === "under_review").length

  const totalRevenue = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
  const totalCommission = Math.round(totalRevenue * 0.1)
  const averageTransaction = payments.length > 0 ? Math.round(totalRevenue / payments.length) : 0

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const byDay = new Map<string, { earnings: number; users: number }>()
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date()
    day.setDate(day.getDate() - i)
    const key = day.toISOString().slice(0, 10)
    byDay.set(key, { earnings: 0, users: 0 })
  }

  for (const payment of payments) {
    const key = payment.createdAt.toISOString().slice(0, 10)
    const bucket = byDay.get(key)
    if (bucket) bucket.earnings += payment.amount || 0
  }

  for (const user of recentUsers) {
    const key = user.createdAt.toISOString().slice(0, 10)
    const bucket = byDay.get(key)
    if (bucket) bucket.users += 1
  }

  const chartData = Array.from(byDay.entries()).map(([key, bucket]) => {
    const day = new Date(key)
    const earnings = bucket.earnings
    const commission = Math.round(earnings * 0.1)
    return {
      day: dayLabels[day.getDay()],
      earnings,
      commission,
      users: bucket.users,
    }
  })

  const pendingTasks = jobs.filter((job: any) => ["pending", "accepted", "in_progress"].includes(job.status)).length
  const disputedTasks = jobs.filter((job: any) => job.status === "disputed").length
  const totalTaskBase = Math.max(1, completedTasks + pendingTasks + disputedTasks)
  const pieData = [
    { name: "Completed", value: Math.round((completedTasks / totalTaskBase) * 100), color: "#10b981" },
    { name: "Pending", value: Math.round((pendingTasks / totalTaskBase) * 100), color: "#f59e0b" },
    { name: "Disputed", value: Math.round((disputedTasks / totalTaskBase) * 100), color: "#ef4444" },
  ]

  const recentActivities = [
    ...recentUsers.map((u: any) => ({ label: "New user registered", detail: u.name, time: relativeTime(u.createdAt), at: u.createdAt.getTime(), type: "user" as const })),
    ...recentJobs.map((j: any) => ({ label: j.status === "completed" ? "Task completed" : "Job posted", detail: j.title, time: relativeTime(j.createdAt), at: j.createdAt.getTime(), type: j.status === "completed" ? "completed" as const : "job" as const })),
    ...recentDisputes.map((d: any) => ({ label: "Dispute raised", detail: d.reason, time: relativeTime(d.createdAt), at: d.createdAt.getTime(), type: "dispute" as const })),
  ]
    .sort((a, b) => b.at - a.at)
    .slice(0, 6)
    .map(({ at, ...item }) => item)

  const earningsByProvider = new Map<string, { earnings: number; tasks: number }>()
  for (const job of completedProviderJobs) {
    if (!job.providerId) continue
    const current = earningsByProvider.get(job.providerId) || { earnings: 0, tasks: 0 }
    current.earnings += job.price
    current.tasks += 1
    earningsByProvider.set(job.providerId, current)
  }

  const topPerformers = providers
    .map((provider: any) => {
      const agg = earningsByProvider.get(provider.id) || { earnings: 0, tasks: 0 }
      return {
        name: provider.name,
        earnings: agg.earnings,
        tasks: agg.tasks,
        status: agg.tasks > 0 ? "Active" as const : "Inactive" as const,
      }
    })
    .sort((a: any, b: any) => b.earnings - a.earnings)
    .slice(0, 4)

  return NextResponse.json({
    ok: true,
    summary: {
      totalUsers: users,
      activeJobs,
      completedTasks,
      openDisputes,
      totalRevenue,
      totalCommission,
      averageTransaction,
    },
    chartData,
    pieData,
    recentActivities,
    topPerformers,
  })
}
