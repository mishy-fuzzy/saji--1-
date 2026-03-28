import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

type DisputeStatus = "open" | "under_review" | "resolved";

function mapStatus(status: string): DisputeStatus {
  const value = String(status || "open").toLowerCase();
  if (value === "resolved") return "resolved";
  if (value === "under_review" || value === "in review") return "under_review";
  return "open";
}

function toBookingStatus(status: string): string {
  const value = String(status || "open").toLowerCase();
  if (value === "resolved") return "resolved";
  if (value === "under_review" || value === "in review") return "under_review";
  if (value === "rejected") return "cancelled";
  return "disputed";
}

export async function GET() {
  const rows = await db.booking.findMany({
    where: {
      status: { in: ["disputed", "under_review", "resolved"] },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      customer: { select: { id: true, name: true, email: true } },
      provider: { select: { id: true, name: true, email: true } },
      service: {
        select: { id: true, name: true, basePrice: true, category: true },
      },
    },
  });

  const disputes = rows.map((row) => ({
    id: row.id,
    job: {
      id: row.id,
      title: row.service?.name || "Service Job",
      status: row.status,
      price: row.amount,
    },
    createdBy: {
      id: row.customer.id,
      name: row.customer.name,
      email: row.customer.email,
    },
    assignedTo: row.provider
      ? {
          id: row.provider.id,
          name: row.provider.name,
          email: row.provider.email,
        }
      : null,
    reason: row.service?.category || row.service?.name || "Dispute raised",
    details: row.service?.name || row.service?.category || null,
    status: mapStatus(row.status),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));

  return NextResponse.json({ ok: true, disputes });
}

export async function POST(request: Request) {
  const body = await request.json();

  const jobId = String(body?.jobId || "").trim();
  const reason = String(body?.reason || "").trim();

  if (!jobId || !reason) {
    return NextResponse.json(
      { ok: false, error: "jobId and reason are required" },
      { status: 400 },
    );
  }

  const booking = await db.booking.update({
    where: { id: jobId },
    data: { status: "disputed" },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      provider: { select: { id: true, name: true, email: true } },
      service: {
        select: { id: true, name: true, basePrice: true, category: true },
      },
    },
  });

  return NextResponse.json(
    {
      ok: true,
      dispute: {
        id: booking.id,
        job: {
          id: booking.id,
          title: booking.service?.name || "Service Job",
          status: booking.status,
          price: booking.amount,
        },
        createdBy: {
          id: booking.customer.id,
          name: booking.customer.name,
          email: booking.customer.email,
        },
        assignedTo: booking.provider
          ? {
              id: booking.provider.id,
              name: booking.provider.name,
              email: booking.provider.email,
            }
          : null,
        reason,
        details: body?.details ? String(body.details) : null,
        status: mapStatus(booking.status),
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      },
    },
    { status: 201 },
  );
}
