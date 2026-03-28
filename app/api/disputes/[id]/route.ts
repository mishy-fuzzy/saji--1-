import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

function toStatus(value: string): string {
  const normalized = String(value || "open").toLowerCase();
  if (normalized === "resolved") return "resolved";
  if (normalized === "in review" || normalized === "under_review")
    return "under_review";
  return "open";
}

function toBookingStatus(value: string): string {
  const normalized = String(value || "open").toLowerCase();
  if (normalized === "resolved") return "resolved";
  if (normalized === "in review" || normalized === "under_review")
    return "under_review";
  if (normalized === "rejected") return "cancelled";
  return "disputed";
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const status = toStatus(String(body?.status || "open"));

    const dispute = await db.booking.update({
      where: { id },
      data: { status: toBookingStatus(status) },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        provider: { select: { id: true, name: true, email: true } },
        service: {
          select: { id: true, name: true, basePrice: true, category: true },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      dispute: {
        id: dispute.id,
        job: {
          id: dispute.id,
          title: dispute.service?.name || "Service Job",
          status: dispute.status,
          price: dispute.amount,
        },
        createdBy: {
          id: dispute.customer.id,
          name: dispute.customer.name,
          email: dispute.customer.email,
        },
        assignedTo: dispute.provider
          ? {
              id: dispute.provider.id,
              name: dispute.provider.name,
              email: dispute.provider.email,
            }
          : null,
        reason:
          dispute.service?.category ||
          dispute.service?.name ||
          "Dispute raised",
        details: dispute.service?.name || dispute.service?.category || null,
        status: toStatus(dispute.status),
        createdAt: dispute.createdAt,
        updatedAt: dispute.updatedAt,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update dispute";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await db.booking.update({ where: { id }, data: { status: "cancelled" } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete dispute";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
