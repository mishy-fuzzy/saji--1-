import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionFromRequest } from "@/lib/server/session";

const prismaDb: any = db;

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session?.userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch current user for ranking
    const currentUser = await prismaDb.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch all agents with their performance metrics
    const agents = await prismaDb.user.findMany({
      where: {
        role: "agent",
        deletedAt: null,
        isSuspended: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Fetch disputes and jobs to calculate metrics
    const [disputes, jobs] = await Promise.all([
      prismaDb.dispute.findMany({
        select: {
          id: true,
          assignedTo: { select: { id: true } },
          status: true,
          createdAt: true,
        },
      }),
      prismaDb.job.findMany({
        select: {
          id: true,
          providerId: true,
          status: true,
          price: true,
        },
      }),
    ]);

    // Calculate metrics for each agent
    const agentMetrics = agents.map((agent: any) => {
      const agentDisputes = disputes.filter(
        (d: any) => d.assignedTo?.id === agent.id
      );
      const agentJobs = jobs.filter((j: any) => j.providerId === agent.id);

      const totalCases = agentDisputes.length || 0;
      const resolvedCases = agentDisputes.filter(
        (d: any) => d.status === "resolved"
      ).length;
      const resolvedPercentage =
        totalCases > 0 ? Math.round((resolvedCases / totalCases) * 100) : 0;

      // Use resolved percentage as proxy for rating (80% resolved = 4.0 stars)
      const avgRating = (3 + resolvedPercentage / 25).toFixed(1);

      const totalEarnings = agentJobs
        .filter((j: any) => j.status === "completed")
        .reduce((sum: number, j: any) => sum + j.price, 0);

      return {
        id: agent.id,
        name: agent.name || "Unknown Agent",
        cases: totalCases,
        resolved: resolvedCases,
        rating: parseFloat(String(avgRating)),
        satisfaction: resolvedPercentage,
        earnings: `KES ${totalEarnings.toLocaleString()}`,
        isCurrentUser: agent.id === currentUser.id,
      };
    });

    // Sort by cases (descending)
    const sortedAgents = agentMetrics
      .sort((a: any, b: any) => b.cases - a.cases)
      .map((agent: any, index: number) => ({
        ...agent,
        rank: index + 1,
      }));

    return NextResponse.json({
      ok: true,
      data: sortedAgents,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch leaderboard";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
