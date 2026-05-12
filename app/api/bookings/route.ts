import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

const prismaDb: any = db;
const REFERRAL_DISCOUNT_KES = 300;
const REFERRAL_REWARD_KES = 500;

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const providerId = searchParams.get("providerId");

    const bookings = await prismaDb.booking.findMany({
      where: {
        ...(customerId ? { customerId } : {}),
        ...(providerId ? { providerId } : {}),
      },
      include: {
        customer: {
          select: { name: true, email: true, phone: true, image: true },
        },
        provider: {
          select: { name: true, email: true, phone: true, image: true },
        },
        service: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, data: bookings });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch bookings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerId, providerId, serviceId, amount, currency } = body;
    const bookingAmount = Math.max(1, Number(amount || 0));

    const result = await prismaDb.$transaction(async (tx: any) => {
      const pendingReferral = await tx.referral.findFirst({
        where: {
          referredId: String(customerId || ""),
          status: { not: "completed" },
        },
        select: {
          id: true,
          referrerId: true,
        },
      });

      const discountAmount = pendingReferral
        ? Math.min(REFERRAL_DISCOUNT_KES, bookingAmount - 1)
        : 0;
      const finalAmount = Math.max(1, bookingAmount - discountAmount);

      const booking = await tx.booking.create({
        data: {
          customerId,
          providerId,
          serviceId,
          amount: finalAmount,
          currency,
          status: "pending",
        },
      });

      let referralRewarded = false;

      if (pendingReferral) {
        const updated = await tx.referral.updateMany({
          where: {
            id: pendingReferral.id,
            status: { not: "completed" },
          },
          data: {
            status: "completed",
            reward: REFERRAL_REWARD_KES,
          },
        });

        if (updated.count > 0) {
          referralRewarded = true;

          await tx.wallet.upsert({
            where: { userId: pendingReferral.referrerId },
            update: {
              balance: {
                increment: REFERRAL_REWARD_KES,
              },
            },
            create: {
              userId: pendingReferral.referrerId,
              balance: REFERRAL_REWARD_KES,
              currency: String(currency || "KES"),
            },
          });

          await tx.authLog.create({
            data: {
              provider: "local",
              mode: "referral-completed",
              email: undefined,
              status: "SUCCESS",
              response: JSON.stringify({
                referredId: customerId,
                referrerId: pendingReferral.referrerId,
                reward: REFERRAL_REWARD_KES,
                discount: discountAmount,
                source: "first-booking",
                bookingId: booking.id,
              }),
            },
          });
        }
      }

      return {
        booking,
        discountAmount,
        finalAmount,
        referralRewarded,
      };
    });

    return NextResponse.json({
      ok: true,
      data: {
        ...result.booking,
        discountAmount: result.discountAmount,
        referralRewarded: result.referralRewarded,
        originalAmount: result.finalAmount + result.discountAmount,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create booking";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { bookingId, action } = body;

    if (!bookingId || !action) {
      return NextResponse.json(
        { error: "bookingId and action are required" },
        { status: 400 },
      );
    }

    // Fetch the booking
    const booking = await prismaDb.booking.findUnique({
      where: { id: bookingId },
      include: {
        provider: { select: { id: true, name: true, email: true } },
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 },
      );
    }

    if (action === "complete") {
      if (!["active", "accepted"].includes(String(booking.status || "").toLowerCase())) {
        return NextResponse.json(
          { error: "Booking must be active before completion" },
          { status: 400 },
        );
      }

      // Mark booking as completed
      const updatedBooking = await prismaDb.booking.update({
        where: { id: bookingId },
        data: { status: "completed" },
      });

      // Release funds to provider's wallet
      let providerWallet = await prismaDb.wallet.findUnique({
        where: { userId: booking.providerId },
      });

      if (!providerWallet) {
        // Create wallet if it doesn't exist
        providerWallet = await prismaDb.wallet.create({
          data: {
            userId: booking.providerId,
            balance: 0,
            currency: booking.currency,
          },
        });
      }

      // Add funds to provider wallet
      const updatedWallet = await prismaDb.wallet.update({
        where: { userId: booking.providerId },
        data: {
          balance: providerWallet.balance + booking.amount,
        },
      });

      // Create a transaction record
      await prismaDb.paymentTransaction.create({
        data: {
          provider: "escrow_release",
          kind: "fund_release",
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

      // Send SMS notifications
      if (booking.provider?.phone) {
        await sendSmsNotification(
          booking.provider.phone,
          `Your booking #${bookingId.substring(0, 8)} has been completed and funds (${booking.currency} ${booking.amount}) have been released to your wallet. Thank you for using SAJI!`
        );
      }

      if (booking.customer?.phone) {
        await sendSmsNotification(
          booking.customer.phone,
          `Your booking #${bookingId.substring(0, 8)} is complete. Thank you for using SAJI Marketplace!`
        );
      }

      return NextResponse.json({
        ok: true,
        message: "Booking completed and funds released",
        data: {
          booking: updatedBooking,
          wallet: updatedWallet,
        },
      });
    }

    if (action === "accept") {
      // Provider accepts the booking
      const updatedBooking = await prismaDb.booking.update({
        where: { id: bookingId },
        data: { status: "active" },
      });

      // Send SMS notifications
      if (booking.provider?.phone) {
        await sendSmsNotification(
          booking.provider.phone,
          `You have accepted booking #${bookingId.substring(0, 8)}. It is now active. Total amount: ${booking.currency} ${booking.amount}.`
        );
      }

      if (booking.customer?.phone) {
        await sendSmsNotification(
          booking.customer.phone,
          `Great news! ${booking.provider?.name || "A provider"} has accepted your booking #${bookingId.substring(0, 8)}. The job is now active.`
        );
      }

      return NextResponse.json({
        ok: true,
        message: "Booking accepted and marked active",
        data: updatedBooking,
      });
    }

    if (action === "reject") {
      // Provider or customer rejects the booking
      const updatedBooking = await prismaDb.booking.update({
        where: { id: bookingId },
        data: { status: "cancelled" },
      });

      // Send SMS notifications
      if (booking.provider?.phone) {
        await sendSmsNotification(
          booking.provider.phone,
          `You have declined booking #${bookingId.substring(0, 8)}.`
        );
      }

      if (booking.customer?.phone) {
        await sendSmsNotification(
          booking.customer.phone,
          `Booking #${bookingId.substring(0, 8)} has been cancelled. You can post a new job to find other providers.`
        );
      }

      return NextResponse.json({
        ok: true,
        message: "Booking cancelled",
        data: updatedBooking,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'complete', 'accept', or 'reject'" },
      { status: 400 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update booking";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
