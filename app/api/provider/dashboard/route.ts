import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { getSessionCookieName, verifySessionToken } from "@/lib/server/session"

function toUiStatus(status: string): "in-progress" | "pending" | "completed" {
  if (status === "completed") return "completed"
  if (status === "in_progress") return "in-progress"
  if (status === "accepted") return "in-progress"
  return "pending"
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value
  const sessionUser = token ? verifySessionToken(token) : null

  if (!sessionUser) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const provider = await db.user.findUnique({
    where: { email: sessionUser.email },
    select: { id: true, name: true, role: true },
  })

  if (!provider || (provider.role !== "provider" && provider.role !== "shopkeeper")) {
    return NextResponse.json({ ok: false, error: "Provider account not found" }, { status: 404 })
  }

  const jobs = await db.job.findMany({
    where: { providerId: provider.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      postedBy: {
        select: { name: true },
      },
    },
  })

  const mappedJobs = jobs.map((job: any) => ({
    id: job.id,
    title: job.title,
    customer: job.postedBy?.name || "Customer",
    status: toUiStatus(job.status),
    amount: job.price || 0,
    date: job.createdAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
  }))

  const activeJobs = mappedJobs.filter((job: any) => job.status === "in-progress").length
  const completedJobs = mappedJobs.filter((job: any) => job.status === "completed").length
  const totalEarnings = mappedJobs.filter((job: any) => job.status === "completed").reduce((sum: number, job: any) => sum + job.amount, 0)

  // Temporary computed rating fallback until real review model is wired.
  const rating = completedJobs > 0 ? (4.5 + Math.min(0.4, completedJobs / 200)).toFixed(1) : "0.0"

  return NextResponse.json({
    ok: true,
    stats: {
      activeJobs,
      completedJobs,
      totalEarnings,
      rating: `${rating}★`,
    },
    jobs: mappedJobs,
  })
}
