import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

function mapStatus(value: string): string {
  const v = String(value || "pending").toLowerCase();
  if (v === "succeeded" || v === "success" || v === "paid") return "Completed";
  if (v === "processing") return "Processing";
  if (v === "failed" || v === "error") return "Failed";
  return "Pending";
}

export async function GET() {
  try {
    const rows = await db.paymentTransaction.findMany({
      include: {
        booking: {
          include: {
            customer: { select: { name: true } },
            service: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    const data = rows.map((row: any) => {
      const amount = Number(row.amount || 0);
      const fee = Math.round(amount * 0.1);
      return {
        id: row.id,
        user: row.booking?.customer?.name || "Customer",
        job: row.booking?.service?.name || "Service",
        amount,
        method: row.provider ? String(row.provider).toUpperCase() : "Wallet",
        status: mapStatus(row.status),
        fee,
        date: new Date(row.createdAt).toLocaleString(),
      };
    });

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load payments";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
