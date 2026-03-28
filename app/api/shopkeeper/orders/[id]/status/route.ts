import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

const prismaDb: any = db;

function mapToBookingStatus(status: string): string {
  const normalized = String(status || "pending").toLowerCase();
  if (normalized === "delivered") return "completed";
  if (normalized === "processing") return "in-progress";
  if (normalized === "shipped") return "accepted";
  if (normalized === "cancelled") return "cancelled";
  return "pending";
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const status = mapToBookingStatus(String(body?.status || "pending"));

    const row = await prismaDb.booking.update({
      where: { id: String(id) },
      data: { status },
    });

    return NextResponse.json({ ok: true, data: row });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update order status";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
