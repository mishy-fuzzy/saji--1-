import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionActor } from "@/lib/server/api-auth";

const prismaDb: any = db;

function normalizeInvoiceStatus(
  value: string,
): "paid" | "pending" | "overdue" | "draft" {
  const normalized = String(value || "draft").toLowerCase();
  if (
    normalized === "paid" ||
    normalized === "completed" ||
    normalized === "success"
  )
    return "paid";
  if (normalized === "pending") return "pending";
  if (normalized === "overdue") return "overdue";
  return "draft";
}

function parseJson(value: string | null) {
  if (!value) return {};
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function GET(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    const rows = await prismaDb.paymentTransaction.findMany({
      where: {
        provider: "invoice",
        booking: { providerId: actor.id },
      },
      include: {
        booking: {
          include: {
            customer: { select: { name: true, phone: true } },
            service: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    const data = rows.map((row: any) => {
      const payload = parseJson(row.response);
      const requestPayload = parseJson(row.request);
      const amount = Number(row.amount || 0);
      const tax = Math.round(amount * 0.16);
      const total = amount + tax;

      const items = Array.isArray(payload.items)
        ? payload.items
            .map((item: any) => ({
              desc: String(item?.desc || "Item"),
              qty: Number(item?.qty || 1),
              rate: Number(item?.rate || 0),
            }))
            .filter((item: any) => item.desc)
        : [
            {
              desc: String(row?.booking?.service?.name || "Service"),
              qty: 1,
              rate: amount,
            },
          ];

      return {
        id: row.id,
        bookingId: String(row.bookingId || ""),
        client: String(row?.booking?.customer?.name || "Client"),
        clientPhone: String(row?.booking?.customer?.phone || ""),
        service: String(row?.booking?.service?.name || "Service"),
        date: new Date(row.createdAt).toISOString().slice(0, 10),
        dueDate: String(payload.dueDate || requestPayload.dueDate || ""),
        amount,
        tax,
        total,
        status: normalizeInvoiceStatus(
          String(payload.status || row.status || "draft"),
        ),
        items,
      };
    });

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch invoices";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    const body = await request.json();
    const bookingId = String(body?.bookingId || "").trim();
    const dueDate = String(body?.dueDate || "").trim();
    const items = Array.isArray(body?.items)
      ? body.items
          .map((item: any) => ({
            desc: String(item?.desc || "").trim(),
            qty: Math.max(1, Math.round(Number(item?.qty || 1))),
            rate: Math.max(0, Math.round(Number(item?.rate || 0))),
          }))
          .filter((item: any) => item.desc)
      : [];

    if (!bookingId) {
      return NextResponse.json(
        { ok: false, error: "bookingId is required" },
        { status: 400 },
      );
    }

    const booking = await prismaDb.booking.findFirst({
      where: { id: bookingId, providerId: actor.id },
      include: {
        customer: { select: { name: true, phone: true } },
        service: { select: { name: true } },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { ok: false, error: "Booking not found" },
        { status: 404 },
      );
    }

    const amount = items.length
      ? items.reduce((sum: number, item: any) => sum + item.qty * item.rate, 0)
      : Number(booking.amount || 0);

    const row = await prismaDb.paymentTransaction.create({
      data: {
        provider: "invoice",
        kind: "issue",
        bookingId: booking.id,
        amount,
        currency: "KES",
        status: "DRAFT",
        request: JSON.stringify({
          bookingId: booking.id,
          dueDate,
          items,
        }),
        response: JSON.stringify({
          dueDate,
          items,
          status: "draft",
        }),
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, data: { id: row.id } });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create invoice";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
