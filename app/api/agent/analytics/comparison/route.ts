import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { getSessionFromRequest } from "@/lib/server/session"

const prismaDb: any = db

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request)
    if (!session?.userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }
    const agents = await prismaDb.user.findMany({
      where: { role: "agent" },
      select: { id: true, name: true },
    })

    // Get disputes and jobs for all agents
    const [allDisputes, allJobs] = await Promise.all([
      prismaDb.dispute.findMany({
        select: { id: true, agentId: true, status: true },
      }),
      prismaDb.job.findMany({
        select: { id: true, providerId: true, price: true },
      }),
    ])

    // Calculate comparison data for each agent
    const agentComparison = agents.map((agent: any, index: number) => {
      const agentDisputes = allDisputes.filter((d: any) => d.agentId === agent.id)
      const agentJobs = allJobs.filter((j: any) => j.providerId === agent.id)
      
      const totalCases = agentDisputes.length
      const resolvedCases = agentDisputes.filter((d: any) => d.status === "resolved").length
      const resolutionRate = totalCases > 0 ? (resolvedCases / totalCases) * 100 : 0
      const earnings = agentJobs.reduce((sum: number, j: any) => sum + (j.price || 0), 0)
      const rating = Math.min(5, 4.0 + (resolutionRate / 100) * 1)

      return {
        rank: index + 1,
        name: agent.name || "Agent",
        cases: totalCases,
        rating: parseFloat(rating.toFixed(1)),
        earnings: Math.round(earnings),
      }
    })

    // Sort by cases descending
    agentComparison.sort((a: any, b: any) => b.cases - a.cases)

    // Add rank after sorting
    agentComparison.forEach((agent: any, idx: number) => {
      agent.rank = idx + 1
    })

    return NextResponse.json({
      ok: true,
      data: {
        agents: agentComparison,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Agent analytics comparison error:", error)
    return NextResponse.json(
      { ok: false, error: "Failed to fetch agent comparison" },
      { status: 500 }
    )
  }
}
