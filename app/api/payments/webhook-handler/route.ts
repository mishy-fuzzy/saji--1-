import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

// Type definitions for webhook payloads
interface MpesaWebhookPayload {
  Body?: {
    stkCallback?: {
      CheckoutRequestID?: string;
      ResultCode?: number;
      ResultDesc?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface StripeWebhookPayload {
  type?: string;
  data?: {
    object?: {
      id?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface PayPalWebhookPayload {
  event_type?: string;
  resource?: {
    id?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const eventType = String(body?.type || body?.event_type || "").toLowerCase();
    const provider = String(body?.provider || "").toLowerCase();

    if (!eventType || !provider) {
      return NextResponse.json(
        { error: "Missing event_type and provider" },
        { status: 400 }
      );
    }

    // Handle M-Pesa webhook
    if (provider === "mpesa") {
      return handleMpesaWebhook(body as MpesaWebhookPayload);
    }

    // Handle Stripe webhook
    if (provider === "stripe") {
      return handleStripeWebhook(body as StripeWebhookPayload);
    }

    // Handle PayPal webhook
    if (provider === "paypal") {
      return handlePaypalWebhook(body as PayPalWebhookPayload);
    }

    return NextResponse.json(
      { error: "Unsupported payment provider" },
      { status: 400 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook processing failed";
    console.error("Webhook error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

async function handleMpesaWebhook(payload: MpesaWebhookPayload) {
  try {
    const callback = payload?.Body?.stkCallback;
    const checkoutRequestId = String(callback?.CheckoutRequestID || "");
    const resultCode = Number(callback?.ResultCode ?? -1);
    const resultDesc = String(callback?.ResultDesc || "");

    if (!checkoutRequestId) {
      return NextResponse.json(
        { error: "Missing CheckoutRequestID" },
        { status: 400 }
      );
    }

    // Find the payment transaction
    const transaction = await db.paymentTransaction.findFirst({
      where: { externalId: checkoutRequestId },
      include: { booking: true },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Payment transaction not found" },
        { status: 404 }
      );
    }

    const status = resultCode === 0 ? "success" : "failed";

    // Update transaction status
    await db.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: status.toUpperCase(),
        response: JSON.stringify(payload),
        error: resultCode === 0 ? null : resultDesc,
      },
    });

    // Update booking status if payment succeeded
    if (status === "success" && transaction.booking) {
      await db.booking.update({
        where: { id: transaction.bookingId || "" },
        data: { status: "pending" },
      });
    }

    return NextResponse.json({
      ok: true,
      message: `M-Pesa payment ${status}`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "M-Pesa webhook failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

async function handleStripeWebhook(payload: StripeWebhookPayload) {
  try {
    const eventType = String(payload?.type || "").toLowerCase();
    const paymentIntent = payload?.data?.object;
    const intentId = String(paymentIntent?.id || "");

    if (!intentId) {
      return NextResponse.json(
        { error: "Missing payment intent ID" },
        { status: 400 }
      );
    }

    // Find the payment transaction
    const transaction = await db.paymentTransaction.findFirst({
      where: { externalId: intentId },
      include: { booking: true },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Payment transaction not found" },
        { status: 404 }
      );
    }

    let status = "pending";
    if (eventType === "payment_intent.succeeded") {
      status = "success";
    } else if (eventType === "payment_intent.payment_failed") {
      status = "failed";
    }

    // Update transaction status
    await db.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: status.toUpperCase(),
        response: JSON.stringify(payload),
      },
    });

    // Update booking status if payment succeeded
    if (status === "success" && transaction.booking) {
      await db.booking.update({
        where: { id: transaction.bookingId || "" },
        data: { status: "pending" },
      });
    }

    return NextResponse.json({
      ok: true,
      message: `Stripe payment ${status}`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Stripe webhook failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

async function handlePaypalWebhook(payload: PayPalWebhookPayload) {
  try {
    const eventType = String(payload?.event_type || "").toLowerCase();
    const resource = payload?.resource || {};
    const orderId = String(resource?.id || "");

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing order ID" },
        { status: 400 }
      );
    }

    // Find the payment transaction
    const transaction = await db.paymentTransaction.findFirst({
      where: { externalId: orderId },
      include: { booking: true },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Payment transaction not found" },
        { status: 404 }
      );
    }

    let status = "pending";
    if (eventType === "checkout.order.completed") {
      status = "success";
    } else if (eventType === "checkout.order.approved") {
      status = "success";
    } else if (eventType === "checkout.order.denied") {
      status = "failed";
    }

    // Update transaction status
    await db.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: status.toUpperCase(),
        response: JSON.stringify(payload),
      },
    });

    // Update booking status if payment succeeded
    if (status === "success" && transaction.booking) {
      await db.booking.update({
        where: { id: transaction.bookingId || "" },
        data: { status: "pending" },
      });
    }

    return NextResponse.json({
      ok: true,
      message: `PayPal payment ${status}`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "PayPal webhook failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
