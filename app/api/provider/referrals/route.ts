import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionActor } from "@/lib/server/api-auth";
import { resolveAppUrlFromRequest } from "@/lib/server/app-url";

const prismaDb: any = db;

export async function GET(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    const rows = await prismaDb.referral.findMany({
      where: { referrerId: actor.id },
      include: {
        referred: {
          select: { id: true, name: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    const referrals = rows.map((row: any) => ({
      id: row.id,
      name: row?.referred?.name || "User",
      date: new Date(row.createdAt).toISOString().slice(0, 10),
      status: String(row.status || "pending").toLowerCase(),
      earned: Number(row.reward || 0),
    }));

    const opensCount = await prismaDb.authLog.count({
      where: {
        provider: "local",
        mode: "referral-open",
        status: "SUCCESS",
        response: { contains: `\"referrerId\":\"${actor.id}\"` },
      },
    });

    const completedCount = referrals.filter((row: any) => row.status === "completed").length;
    const totalEarned = referrals
      .filter((row: any) => row.status === "completed")
      .reduce((sum: number, row: any) => sum + Number(row.earned || 0), 0);
    const invitedCount = Math.max(referrals.length, Number(opensCount || 0));

    const prefix = String(actor.name || "provider")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.slice(0, 3).toUpperCase())
      .join("");

    const referralCode = `${prefix || "SAJI"}-SAJI-${actor.id.slice(-4).toUpperCase()}`;
    const appUrl = resolveAppUrlFromRequest(request);
    const referralLink = `${appUrl}/join?ref=${encodeURIComponent(referralCode)}&rid=${encodeURIComponent(actor.id)}&role=provider`;

    return NextResponse.json({
      ok: true,
      data: {
        referralCode,
        referralLink,
        referrals,
        stats: {
          invited: invitedCount,
          completed: completedCount,
          earned: totalEarned,
          opens: Number(opensCount || 0),
        },
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch referrals";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
