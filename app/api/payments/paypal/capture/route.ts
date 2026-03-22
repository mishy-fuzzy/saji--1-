import { NextResponse } from "next/server"
import { capturePayPalOrder } from "@/lib/server/paypal"
import { db, serializePayload } from "@/lib/server/db"
import { createInAppNotification } from "@/lib/server/in-app-notifications"

export async function POST(request: Request) {
  let requestBody: unknown = null
  try {
    const body = await request.json()
    requestBody = body
    const orderId = String(body?.orderId || "")

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 })
    }

    const result = await capturePayPalOrder(orderId)

    await db.paymentTransaction.updateMany({
      where: { provider: "paypal", externalId: orderId },
      data: {
        status: String(result?.status || "COMPLETED").toUpperCase(),
        response: serializePayload(result),
      },
    })

    const successful = String(result?.status || "").toUpperCase() === "COMPLETED"
    const tx = await db.paymentTransaction.findFirst({
      where: { provider: "paypal", externalId: orderId },
      include: {
        booking: {
          select: {
            id: true,
            customerId: true,
            providerId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    if (successful && tx?.bookingId) {
      await db.booking.updateMany({
        where: { id: tx.bookingId, status: "pending" },
        data: { status: "confirmed" },
      })

      if (tx.booking?.customerId) {
        await createInAppNotification({
          userId: tx.booking.customerId,
          type: "payment",
          title: "Payment confirmed",
          message: "Your PayPal payment was captured successfully.",
          actionHref: "/customer/wallet",
          metadata: { provider: "paypal", orderId, bookingId: tx.bookingId },
        })
      }

      if (tx.booking?.providerId) {
        await createInAppNotification({
          userId: tx.booking.providerId,
          type: "payment",
          title: "Booking funded",
          message: "A customer payment was confirmed for an upcoming booking.",
          actionHref: "/provider/jobs",
          metadata: { provider: "paypal", orderId, bookingId: tx.bookingId },
        })
      }
    }

    return NextResponse.json({ ok: true, data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to capture PayPal order"

    try {
      await db.paymentTransaction.create({
        data: {
          provider: "paypal",
          kind: "capture",
          status: "FAILED",
          request: serializePayload(requestBody),
          error: message,
        },
      })
    } catch {
      // Keep API response behavior stable when DB logging fails.
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
