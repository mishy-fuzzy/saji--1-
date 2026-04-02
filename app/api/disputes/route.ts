import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

type DisputeStatus = "open" | "under_review" | "resolved";

async function sendSmsNotification(phone: string, message: string) {
  try {
    // Call the SMS API endpoint
    const response = await fetch(new URL("/api/notifications/sms/send", process.env.NEXTAUTH_URL || "http://localhost:3000"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: phone, message }),
    });
    
    if (!response.ok) {
      console.warn(`Failed to send SMS to ${phone}: ${response.status}`);
    }
  } catch (error) {
    console.warn(`SMS notification error for ${phone}:`, error);
    // Don't throw - SMS is non-critical
  }
}

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

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { bookingId, resolution } = body;

    if (!bookingId || !resolution) {
      return NextResponse.json(
        { error: "bookingId and resolution are required" },
        { status: 400 },
      );
    }

    // resolution can be "refund_customer", "release_to_provider", or "split"

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: { select: { id: true, wallet: true } },
        provider: { select: { id: true, wallet: true } },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 },
      );
    }

    let updatedBooking;
    const transactionRecords = [];

    if (resolution === "refund_customer") {
      // Full refund to customer
      updatedBooking = await db.booking.update({
        where: { id: bookingId },
        data: { status: "resolved" },
      });

      // Add funds to customer wallet
      let customerWallet = await db.wallet.findUnique({
        where: { userId: booking.customerId },
      });

      if (!customerWallet) {
        customerWallet = await db.wallet.create({
          data: {
            userId: booking.customerId,
            balance: 0,
            currency: booking.currency,
          },
        });
      }

      await db.wallet.update({
        where: { userId: booking.customerId },
        data: {
          balance: customerWallet.balance + booking.amount,
        },
      });

      // Log transaction
      await db.paymentTransaction.create({
        data: {
          provider: "dispute_resolution",
          kind: "customer_refund",
          status: "success",
          amount: booking.amount,
          currency: booking.currency,
          bookingId: bookingId,
          reference: `REFUND-${bookingId}`,
          response: JSON.stringify({
            message: "Full refund issued to customer",
            customerId: booking.customerId,
            amount: booking.amount,
          }),
        },
      });
    } else if (resolution === "release_to_provider") {
      // Full release to provider
      updatedBooking = await db.booking.update({
        where: { id: bookingId },
        data: { status: "resolved" },
      });

      // Add funds to provider wallet
      let providerWallet = await db.wallet.findUnique({
        where: { userId: booking.providerId },
      });

      if (!providerWallet) {
        providerWallet = await db.wallet.create({
          data: {
            userId: booking.providerId,
            balance: 0,
            currency: booking.currency,
          },
        });
      }

      await db.wallet.update({
        where: { userId: booking.providerId },
        data: {
          balance: providerWallet.balance + booking.amount,
        },
      });

      // Log transaction
      await db.paymentTransaction.create({
        data: {
          provider: "dispute_resolution",
          kind: "provider_release",
          status: "success",
          amount: booking.amount,
          currency: booking.currency,
          bookingId: bookingId,
          reference: `RELEASE-${bookingId}`,
          response: JSON.stringify({
            message: "Funds released to provider",
            providerId: booking.providerId,
            amount: booking.amount,
          }),
        },
      });
    } else if (resolution === "split") {
      // 50/50 split
      updatedBooking = await db.booking.update({
        where: { id: bookingId },
        data: { status: "resolved" },
      });

      const splitAmount = Math.floor(booking.amount / 2);

      // Add to customer wallet
      let customerWallet = await db.wallet.findUnique({
        where: { userId: booking.customerId },
      });

      if (!customerWallet) {
        customerWallet = await db.wallet.create({
          data: {
            userId: booking.customerId,
            balance: 0,
            currency: booking.currency,
          },
        });
      }

      await db.wallet.update({
        where: { userId: booking.customerId },
        data: {
          balance: customerWallet.balance + splitAmount,
        },
      });

      // Add to provider wallet
      let providerWallet = await db.wallet.findUnique({
        where: { userId: booking.providerId },
      });

      if (!providerWallet) {
        providerWallet = await db.wallet.create({
          data: {
            userId: booking.providerId,
            balance: 0,
            currency: booking.currency,
          },
        });
      }

      await db.wallet.update({
        where: { userId: booking.providerId },
        data: {
          balance: providerWallet.balance + splitAmount,
        },
      });

      // Log transactions
      await db.paymentTransaction.create({
        data: {
          provider: "dispute_resolution",
          kind: "split_refund",
          status: "success",
          amount: splitAmount,
          currency: booking.currency,
          bookingId: bookingId,
          reference: `SPLIT-${bookingId}-CUSTOMER`,
          response: JSON.stringify({
            message: "50% refund to customer",
            customerId: booking.customerId,
            amount: splitAmount,
          }),
        },
      });

      await db.paymentTransaction.create({
        data: {
          provider: "dispute_resolution",
          kind: "split_release",
          status: "success",
          amount: splitAmount,
          currency: booking.currency,
          bookingId: bookingId,
          reference: `SPLIT-${bookingId}-PROVIDER`,
          response: JSON.stringify({
            message: "50% released to provider",
            providerId: booking.providerId,
            amount: splitAmount,
          }),
        },
      });
    } else {
      return NextResponse.json(
        {
          error:
            "Invalid resolution. Use 'refund_customer', 'release_to_provider', or 'split'",
        },
        { status: 400 },
      );
    }

    // Send SMS notifications about dispute resolution
    const customer = await db.user.findUnique({
      where: { id: booking.customerId },
      select: { phone: true, name: true },
    });

    const provider = await db.user.findUnique({
      where: { id: booking.providerId },
      select: { phone: true, name: true },
    });

    if (resolution === "refund_customer") {
      if (customer?.phone) {
        await sendSmsNotification(
          customer.phone,
          `Dispute resolved for booking #${bookingId.substring(0, 8)}. Full amount (${booking.currency} ${booking.amount}) has been refunded to your wallet.`
        );
      }
      if (provider?.phone) {
        await sendSmsNotification(
          provider.phone,
          `Dispute for booking #${bookingId.substring(0, 8)} has been resolved. The customer was refunded.`
        );
      }
    } else if (resolution === "release_to_provider") {
      if (provider?.phone) {
        await sendSmsNotification(
          provider.phone,
          `Dispute resolved for booking #${bookingId.substring(0, 8)}. Amount (${booking.currency} ${booking.amount}) has been released to your wallet.`
        );
      }
      if (customer?.phone) {
        await sendSmsNotification(
          customer.phone,
          `Dispute for booking #${bookingId.substring(0, 8)} has been resolved in favor of the provider.`
        );
      }
    } else if (resolution === "split") {
      const splitAmount = Math.floor(booking.amount / 2);
      if (customer?.phone) {
        await sendSmsNotification(
          customer.phone,
          `Dispute for booking #${bookingId.substring(0, 8)} has been resolved. ${booking.currency} ${splitAmount} refunded to your wallet.`
        );
      }
      if (provider?.phone) {
        await sendSmsNotification(
          provider.phone,
          `Dispute for booking #${bookingId.substring(0, 8)} has been resolved. ${booking.currency} ${splitAmount} released to your wallet.`
        );
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Dispute resolved: ${resolution}`,
      data: updatedBooking,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to resolve dispute";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
