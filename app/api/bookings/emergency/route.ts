import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionActor } from "@/lib/server/api-auth";

const prismaDb: any = db;
const DEFAULT_DOWNPAYMENT_PERCENT = 0.25;

function toPositiveInt(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.round(parsed);
}

function toPercent(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < 0) return 0;
  if (parsed > 1) return 1;
  return parsed;
}

function toNumberOrNull(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export async function POST(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    if (String(actor.role || "").toLowerCase() !== "customer") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const serviceId = String(body?.serviceId || "").trim();
    const description = String(body?.description || "").trim();
    const location = String(body?.location || "").trim();
    const latitude = toNumberOrNull(body?.latitude);
    const longitude = toNumberOrNull(body?.longitude);

    if (!serviceId) {
      return NextResponse.json(
        { ok: false, error: "serviceId is required" },
        { status: 400 },
      );
    }

    const service = await prismaDb.service.findFirst({
      where: { id: serviceId },
      select: {
        id: true,
        name: true,
        basePrice: true,
        providerId: true,
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isSuspended: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!service || !service.providerId || !service.provider) {
      return NextResponse.json(
        { ok: false, error: "Emergency service not found" },
        { status: 404 },
      );
    }

    if (service.provider.deletedAt || service.provider.isSuspended) {
      return NextResponse.json(
        { ok: false, error: "Provider is not available" },
        { status: 409 },
      );
    }

    const emergencySurcharge = toPositiveInt(
      process.env.EMERGENCY_SURCHARGE,
      0,
    );
    const downpaymentPercent = toPercent(
      process.env.DOWNPAYMENT_PERCENT,
      DEFAULT_DOWNPAYMENT_PERCENT,
    );

    const basePrice = toPositiveInt(service.basePrice, 0);
    const total = basePrice + emergencySurcharge;

    if (total <= 0) {
      return NextResponse.json(
        { ok: false, error: "Emergency service price is invalid" },
        { status: 400 },
      );
    }

    const downpayment = Math.max(0, Math.ceil(total * downpaymentPercent));

    const wallet = await prismaDb.wallet.upsert({
      where: { userId: actor.id },
      update: {},
      create: {
        userId: actor.id,
        currency: "KES",
        balance: 0,
      },
      select: { id: true, balance: true, currency: true },
    });

    const currentBalance = Number(wallet.balance || 0);
    if (downpayment > currentBalance) {
      return NextResponse.json(
        {
          ok: false,
          error: "Insufficient wallet balance",
          data: {
            required: downpayment,
            balance: currentBalance,
            currency: wallet.currency || "KES",
          },
        },
        { status: 402 },
      );
    }

    const result = await prismaDb.$transaction(async (prisma: any) => {
      const booking = await prisma.booking.create({
        data: {
          status: "pending",
          amount: total,
          currency: wallet.currency || "KES",
          customerId: actor.id,
          providerId: service.providerId,
          serviceId: service.id,
        },
      });

      let nextBalance = currentBalance;

      if (downpayment > 0) {
        nextBalance = Math.max(0, currentBalance - downpayment);
        await prisma.wallet.update({
          where: { userId: actor.id },
          data: { balance: nextBalance },
        });

        await prisma.paymentTransaction.create({
          data: {
            provider: "wallet",
            kind: "emergency_downpayment",
            status: "SUCCESS",
            amount: downpayment,
            currency: wallet.currency || "KES",
            bookingId: booking.id,
            reference: `EMERGENCY:${booking.id}`,
            request: JSON.stringify({
              serviceId,
              description,
              location,
              latitude,
              longitude,
              total,
              downpayment,
              emergencySurcharge,
              downpaymentPercent,
            }),
          },
        });
      }

      await prisma.authLog.create({
        data: {
          provider: "system",
          mode: "emergency-booking",
          email: String(actor.email || ""),
          status: "SUCCESS",
          response: JSON.stringify({
            bookingId: booking.id,
            serviceId,
            providerId: service.providerId,
            location,
            description,
            latitude,
            longitude,
            total,
            downpayment,
            emergencySurcharge,
            downpaymentPercent,
          }),
        },
      });

      return {
        bookingId: booking.id,
        walletBalance: nextBalance,
      };
    });

    return NextResponse.json({
      ok: true,
      data: {
        bookingId: result.bookingId,
        total,
        downpayment,
        currency: wallet.currency || "KES",
        walletBalance: result.walletBalance,
        service: {
          id: service.id,
          name: service.name,
        },
        provider: {
          id: service.provider.id,
          name: service.provider.name || "Provider",
        },
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to book emergency";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
