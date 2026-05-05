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

function formatPaymentMethod(transaction: any): string {
  const provider = String(transaction?.provider || "").trim().toLowerCase();
  const kind = String(transaction?.kind || "").trim().toLowerCase();

  if (provider === "mpesa" || provider === "m-pesa" || kind === "stkpush") {
    return "M-Pesa";
  }

  if (provider === "wallet" || kind === "deposit") {
    return "Wallet";
  }

  if (provider === "escrow_release" || kind === "fund_release") {
    return "Escrow";
  }

  return String(transaction?.provider || transaction?.kind || "").trim();
}

function toPositiveNumber(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return 0;
  return num;
}

function parseQuantityCandidate(raw: string | null | undefined): number {
  if (!raw) return 0;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const keys = ["quantity", "qty", "units", "itemCount", "count", "totalItems"];
    for (const key of keys) {
      const value = toPositiveNumber(parsed[key]);
      if (value > 0) return Math.round(value);
    }
    return 0;
  } catch {
    return 0;
  }
}

function deriveQuantity(row: any): number | null {
  const fromTransaction =
    parseQuantityCandidate(String(row.paymentTransactions?.[0]?.request || "")) ||
    parseQuantityCandidate(String(row.paymentTransactions?.[0]?.response || ""));

  if (fromTransaction > 0) {
    return fromTransaction;
  }

  const amount = toPositiveNumber(row.amount);
  const basePrice = toPositiveNumber(row.service?.basePrice);

  if (amount > 0 && basePrice > 0) {
    return Math.max(1, Math.round(amount / basePrice));
  }

  return null;
}

function parseLocationResponse(raw: string | null | undefined): string {
  if (!raw) return "";

  try {
    const parsed = JSON.parse(raw) as { location?: unknown };
    return String(parsed?.location || "").trim();
  } catch {
    return "";
  }
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
        paymentTransactions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { provider: true, kind: true, request: true, response: true },
        },
        bids: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { note: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    const customerEmails = Array.from(
      new Set(
        rows
          .map((row: any) => String(row.customer?.email || "").trim())
          .filter(Boolean),
      ),
    );

    const locationLogs = customerEmails.length
      ? await prismaDb.authLog.findMany({
          where: {
            provider: "local",
            mode: "user-location",
            status: "SUCCESS",
            email: { in: customerEmails },
          },
          orderBy: { createdAt: "desc" },
          select: { email: true, response: true },
          take: 1000,
        })
      : [];

    const locationByEmail = new Map<string, string>();
    for (const entry of locationLogs) {
      const email = String(entry.email || "").trim().toLowerCase();
      if (!email || locationByEmail.has(email)) continue;
      const location = parseLocationResponse(entry.response);
      if (location) {
        locationByEmail.set(email, location);
      }
    }

    const data = rows.map((row: any) => {
      const customerEmail = String(row.customer?.email || "").trim().toLowerCase();

      return {
        id: row.id,
        customer: row.customer?.name || "Customer",
        avatar: row.customer?.image || "/placeholder.svg",
        phone: row.customer?.phone || "",
        email: row.customer?.email || "",
        product: row.service?.name || "Service",
        productImage: row.service?.image || "/placeholder.svg",
        amount: Number(row.amount || 0),
        status: toOrderStatus(String(row.status || "pending")),
        date: new Date(row.createdAt).toLocaleString(),
        createdAt: row.createdAt,
        quantity: deriveQuantity(row),
        location: locationByEmail.get(customerEmail) || "",
        paymentMethod: formatPaymentMethod(row.paymentTransactions?.[0]),
        notes: String(row.bids?.[0]?.note || "").trim(),
      };
    });

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load shopkeeper orders";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
