import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth";

const prismaDb: any = db;

type EarningsRow = {
  id: string;
  type: "Sale" | "Withdrawal";
  description: string;
  amount: number;
  signedAmount: string;
  date: string;
  status: string;
  createdAt: Date;
};

function toRelativeDate(value: Date): string {
  const diffMs = Date.now() - value.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return value.toLocaleDateString();
}

function mapPaymentStatus(
  status: string,
): "Completed" | "Processing" | "Pending" | "Failed" {
  const normalized = String(status || "PENDING").toUpperCase();
  if (normalized === "SUCCESS" || normalized === "COMPLETED")
    return "Completed";
  if (normalized === "PROCESSING") return "Processing";
  if (normalized === "FAILED" || normalized === "ERROR") return "Failed";
  return "Pending";
}

export async function GET(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    if (!hasAnyRole(actor, ["shopkeeper", "admin", "sub-admin", "subadmin"])) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const wallet = await prismaDb.wallet.upsert({
      where: { userId: actor.id },
      update: {},
      create: {
        userId: actor.id,
        currency: "KES",
        balance: 0,
      },
      select: {
        balance: true,
        currency: true,
      },
    });

    const [sales, withdrawals] = await Promise.all([
      prismaDb.booking.findMany({
        where: {
          providerId: actor.id,
          status: { in: ["completed", "accepted", "in-progress"] },
        },
        include: {
          service: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prismaDb.paymentTransaction.findMany({
        where: {
          provider: "wallet",
          kind: "withdraw",
          reference: { startsWith: `WALLET:${actor.id}:` },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    ]);

    const saleRows: EarningsRow[] = sales.map((row: any) => ({
      id: row.id,
      type: "Sale",
      description: row.service?.name || "Service sale",
      amount: Number(row.amount || 0),
      signedAmount: `+KES ${Number(row.amount || 0).toLocaleString()}`,
      date: toRelativeDate(new Date(row.createdAt)),
      status: row.status === "completed" ? "Completed" : "Processing",
      createdAt: row.createdAt,
    }));

    const withdrawalRows: EarningsRow[] = withdrawals.map((row: any) => ({
      id: row.id,
      type: "Withdrawal",
      description: "Wallet withdrawal",
      amount: -Math.abs(Number(row.amount || 0)),
      signedAmount: `-KES ${Math.abs(Number(row.amount || 0)).toLocaleString()}`,
      date: toRelativeDate(new Date(row.createdAt)),
      status: mapPaymentStatus(String(row.status || "PENDING")),
      createdAt: row.createdAt,
    }));

    const transactions: EarningsRow[] = [...saleRows, ...withdrawalRows]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 200);

    const totalEarnings = saleRows
      .filter((row: EarningsRow) => row.status === "Completed")
      .reduce((sum: number, row: EarningsRow) => sum + Math.abs(row.amount), 0);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonth = saleRows
      .filter((row: EarningsRow) => {
        const d = new Date(row.createdAt);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum: number, row: EarningsRow) => sum + Math.abs(row.amount), 0);

    const pending = saleRows
      .filter((row: EarningsRow) => row.status !== "Completed")
      .reduce((sum: number, row: EarningsRow) => sum + Math.abs(row.amount), 0);

    return NextResponse.json({
      ok: true,
      data: {
        currency: wallet.currency || "KES",
        totalEarnings,
        thisMonth,
        available: Number(wallet.balance || 0),
        pending,
        transactions: transactions.map((row) => ({
          id: row.id,
          type: row.type,
          description: row.description,
          amount: row.signedAmount,
          date: row.date,
          status: row.status,
        })),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load earnings";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    if (!hasAnyRole(actor, ["shopkeeper", "admin", "sub-admin", "subadmin"])) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const amount = Number(body?.amount || 0);
    if (!Number.isFinite(amount) || amount < 100) {
      return NextResponse.json(
        { ok: false, error: "Minimum withdrawal amount is KES 100" },
        { status: 400 },
      );
    }

    const walletResponse = await fetch(new URL("/api/wallet", request.url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") || "",
      },
      body: JSON.stringify({
        action: "withdraw",
        amount: Math.round(amount),
        method: String(body?.method || "wallet"),
      }),
    });

    const payload = await walletResponse.json();
    if (!walletResponse.ok || !payload?.ok) {
      return NextResponse.json(
        { ok: false, error: payload?.error || "Failed to process withdrawal" },
        { status: walletResponse.status || 500 },
      );
    }

    return NextResponse.json({ ok: true, data: payload.data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to withdraw funds";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
