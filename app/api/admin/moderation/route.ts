import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"

type ModerationAction = {
  kind?: "verification" | "dispute"
  id?: string
  action?: "approve" | "remove"
}

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
  const [verifications, disputes] = await Promise.all([
    db.verification.findMany({
      where: { status: { in: ["pending", "rejected"] } },
      include: {
        user: {
          select: { name: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 120,
    }),
    db.dispute.findMany({
      where: { status: { in: ["open", "under_review"] } },
      include: {
        createdBy: {
          select: { name: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 120,
    }),
  ])

  const verificationItems = verifications.map((item: any) => ({
    id: item.id,
    kind: "verification" as const,
    type: "verification",
    user: `${item.user.role} - ${item.user.name}`,
    content: item.notes || "Verification documents awaiting moderation",
    reason: item.status === "pending" ? "Pending verification review" : "Rejected verification review",
    severity: item.status === "pending" ? "medium" : "low",
    time: relativeTime(item.createdAt),
    reports: 1,
    createdAt: item.createdAt.toISOString(),
  }))

  const disputeItems = disputes.map((item: any) => ({
    id: item.id,
    kind: "dispute" as const,
    type: "dispute",
    user: `${item.createdBy.role} - ${item.createdBy.name}`,
    content: item.details || item.reason,
    reason: item.reason,
    severity: item.status === "open" ? "high" : "medium",
    time: relativeTime(item.createdAt),
    reports: 1,
    createdAt: item.createdAt.toISOString(),
  }))

  const items = [...verificationItems, ...disputeItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const resolvedToday = await Promise.all([
    db.verification.count({
      where: {
        status: { in: ["approved", "rejected"] },
        updatedAt: { gte: startOfDay },
      },
    }),
    db.dispute.count({
      where: {
        status: { in: ["resolved", "rejected"] },
        updatedAt: { gte: startOfDay },
      },
    }),
  ]).then(([verificationCount, disputeCount]) => verificationCount + disputeCount)

  return NextResponse.json({
    ok: true,
    items,
    metrics: {
      pendingReview: items.length,
      resolvedToday,
      autoFlagged: verifications.length,
      userReports: disputes.length,
      urgent: items.filter((item) => item.severity === "high").length,
      total: items.length,
    },
  })
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as ModerationAction

  if (!body.kind || !body.id || !body.action) {
    return NextResponse.json({ ok: false, error: "kind, id and action are required" }, { status: 400 })
  }

  if (body.kind === "verification") {
    await db.verification.update({
      where: { id: body.id },
      data: {
        status: body.action === "approve" ? "approved" : "rejected",
      },
    })

    return NextResponse.json({ ok: true })
  }

  if (body.kind === "dispute") {
    await db.dispute.update({
      where: { id: body.id },
      data: {
        status: body.action === "approve" ? "resolved" : "rejected",
      },
    })

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: false, error: "Unsupported moderation kind" }, { status: 400 })
}
