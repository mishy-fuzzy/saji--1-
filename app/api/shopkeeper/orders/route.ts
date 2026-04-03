import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

const prismaDb: any = db;

function toOrderStatus(status: string): string {
  const normalized = String(status || "pending").toLowerCase();
  if (normalized === "completed") return "delivered";
  if (normalized === "in-progress") return "processing";
  if (normalized === "accepted") return "processing";
  if (normalized === "cancelled") return "cancelled";
  return "pending";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = String(searchParams.get("providerId") || "").trim();

    const rows = await prismaDb.booking.findMany({
      where: providerId ? { providerId } : undefined,
      include: {
        customer: {
          select: { name: true, email: true, phone: true, image: true },
        },
        service: true,
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    const data = rows.map((row: any) => ({
      id: row.id,
      customer: row.customer?.name || "Customer",
      avatar: row.customer?.image || "/placeholder.svg",
      phone: row.customer?.phone || "",
      email: row.customer?.email || "",
      product: row.service?.name || "Service",
      productImage: row.service?.image || "/placeholder.svg",
      quantity: 1,
      amount: Number(row.amount || 0),
      status: toOrderStatus(String(row.status || "pending")),
      location: "Kenya",
      date: new Date(row.createdAt).toLocaleString(),
      createdAt: row.createdAt,
      paymentMethod: "Wallet",
      notes: "",
    }));

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load shopkeeper orders";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
