import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { authorizeRoles } from "@/lib/server/rbac";

const prismaDb: any = db;

function parseJson(value: string | null): Record<string, unknown> {
  if (!value) return {};
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function isJobModelUnavailable(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return (
    message.includes("job") &&
    (message.includes("does not exist") ||
      message.includes("table") ||
      message.includes("p2021"))
  );
}

async function loadManualJobsSummary() {
  const logs = await prismaDb.authLog.findMany({
    where: {
      provider: "system",
      mode: "admin-manual-job-create",
      status: "SUCCESS",
    },
    select: { response: true },
  });

  const seen = new Set<string>();
  let count = 0;
  let total = 0;

  for (const row of logs) {
    const payload = parseJson(row.response);
    const id = String(payload.id || "");
    if (!id || seen.has(id)) continue;
    seen.add(id);
    count += 1;
    total += Number(payload.price || 0);
  }

  return { count, total };
}

export async function GET(request: Request) {
  const denied = authorizeRoles(request, ["admin", "sub-admin", "subadmin"]);
  if (denied) return denied;

  try {
    const [
      usersResult,
      bookingsCountResult,
      disputesCountResult,
      revenueResult,
      pendingCountResult,
    ] = await Promise.allSettled([
      db.user.count({ where: { deletedAt: null } }),
      db.booking.count(),
      db.booking.count({
        where: { status: { in: ["disputed", "cancelled"] } },
      }),
      db.booking.aggregate({
        where: { status: "completed" },
        _sum: { amount: true },
      }),
      db.booking.count({ where: { status: "pending" } }),
    ]);

    const userCount =
      usersResult.status === "fulfilled" ? usersResult.value : 0;
    const bookingsCount =
      bookingsCountResult.status === "fulfilled"
        ? bookingsCountResult.value
        : 0;
    const disputeCount =
      disputesCountResult.status === "fulfilled"
        ? disputesCountResult.value
        : 0;
    const totalRevenue =
      revenueResult.status === "fulfilled"
        ? Number(revenueResult.value._sum.amount || 0)
        : 0;
    const pendingJobs =
      pendingCountResult.status === "fulfilled" ? pendingCountResult.value : 0;

    let jobsCount = 0;
    let jobValue = 0;

    try {
      const jobsAggregate = await prismaDb.job.aggregate({
        _count: { _all: true },
        _sum: { price: true },
      });
      jobsCount = Number(jobsAggregate?._count?._all || 0);
      jobValue = Number(jobsAggregate?._sum?.price || 0);
    } catch (error) {
      if (!isJobModelUnavailable(error)) {
        throw error;
      }

      const manual = await loadManualJobsSummary();
      jobsCount = manual.count;
      jobValue = manual.total;
    }

    return NextResponse.json({
      ok: true,
      count: userCount,
      users: userCount,
      jobs: jobsCount,
      jobValue,
      bookings: bookingsCount,
      disputes: disputeCount,
      revenue: totalRevenue,
      pending: pendingJobs,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch stats";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
