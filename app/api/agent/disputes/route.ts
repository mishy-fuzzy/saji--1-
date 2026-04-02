import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { getSessionFromRequest } from "@/lib/server/session"

const prismaDb: any = db

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request)
    if (!session?.userId || session.role !== "agent") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get disputes assigned to this agent
    const disputes = await prismaDb.dispute.findMany({
      where: { agentId: session.userId },
      include: {
        customer: { select: { name: true, email: true } },
        provider: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    const formattedDisputes = disputes.map((dispute: any, index: number) => ({
      id: dispute.id,
      disputeId: `DSP-${String(index + 1).padStart(3, "0")}`,
      customer: dispute.customer?.name || "Unknown",
      provider: dispute.provider?.name || "Unknown",
      status: dispute.status === "resolved" ? "Resolved" : dispute.status === "in_progress" ? "In Progress" : "Open",
      severity: dispute.severity || "Medium",
      amount: `KES ${dispute.amount || 0}`,
      date: dispute.createdAt ? new Date(dispute.createdAt).toLocaleDateString() : "N/A",
      description: dispute.description || "Dispute",
      resolution: dispute.status === "resolved" ? "Resolved Successfully" : dispute.status === "in_progress" ? "In Review" : "Pending",
      notes: dispute.notes || "",
    }))

    return NextResponse.json({
      ok: true,
      data: formattedDisputes,
    })
  } catch (error) {
    console.error("Agent disputes error:", error)
    return NextResponse.json(
      { ok: false, error: "Failed to fetch disputes" },
      { status: 500 }
    )
  }
}
