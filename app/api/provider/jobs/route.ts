import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionFromRequest } from "@/lib/server/session";

const prismaDb: any = db;

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session?.userId || session.role !== "provider") {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch jobs for the current provider
    const jobs = await prismaDb.job.findMany({
      where: {
        providerId: session.userId,
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    const formattedJobs = jobs.map((job: any) => {
      const statusMap: Record<string, string> = {
        pending: "pending",
        accepted: "awaiting-confirmation",
        in_progress: "in-progress",
        completed: "completed",
        cancelled: "cancelled",
      };

      return {
        id: job.id,
        title: job.title || "Unknown Job",
        customer: job.customer?.name || "Unknown Customer",
        status: statusMap[job.status] || "pending",
        amount: job.price || 0,
        progress:
          job.status === "in_progress"
            ? 65
            : job.status === "completed"
              ? 100
              : 0,
        rating: 4.8,
        date: job.createdAt,
      };
    });

    // Calculate provider stats
    const [completedJobs, totalEarnings] = await Promise.all([
      prismaDb.job.count({
        where: {
          providerId: session.userId,
          status: "completed",
        },
      }),
      prismaDb.job.aggregate({
        where: {
          providerId: session.userId,
          status: "completed",
        },
        _sum: {
          price: true,
        },
      }),
    ]);

    const stats = {
      activeJobs: jobs.filter((j: any) => j.status === "in_progress").length,
      completedJobs,
      totalEarnings: totalEarnings._sum.price || 0,
      responseRate: 98,
      averageRating: 4.5,
    };

    return NextResponse.json({
      ok: true,
      data: {
        jobs: formattedJobs,
        stats,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch provider jobs";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
