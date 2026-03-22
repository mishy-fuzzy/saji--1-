import { NextResponse } from "next/server"
import { db, serializePayload } from "@/lib/server/db"
import { createInAppNotification } from "@/lib/server/in-app-notifications"

export async function POST(request: Request) {
  try {
    const payload = await request.json()

    const callback = payload?.Body?.stkCallback
    const checkoutRequestId = String(callback?.CheckoutRequestID || "")
    const resultCode = Number(callback?.ResultCode ?? -1)
    const resultDesc = String(callback?.ResultDesc || "")

    if (checkoutRequestId) {
      await db.paymentTransaction.updateMany({
        where: { externalId: checkoutRequestId },
        data: {
          status: resultCode === 0 ? "SUCCESS" : "FAILED",
          response: serializePayload(payload),
          error: resultCode === 0 ? null : resultDesc,
        },
      })

      if (resultCode === 0) {
        const tx = await db.paymentTransaction.findFirst({
          where: { externalId: checkoutRequestId },
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

        if (tx?.bookingId) {
          await db.booking.updateMany({
            where: { id: tx.bookingId, status: "pending" },
            data: { status: "confirmed" },
          })

          if (tx.booking?.customerId) {
            await createInAppNotification({
              userId: tx.booking.customerId,
              type: "payment",
              title: "Payment received",
              message: "Your M-Pesa payment was successfully received.",
              actionHref: "/customer/wallet",
              metadata: { provider: "mpesa", checkoutRequestId, bookingId: tx.bookingId },
            })
          }

          if (tx.booking?.providerId) {
            await createInAppNotification({
              userId: tx.booking.providerId,
              type: "payment",
              title: "Booking payment confirmed",
              message: "A customer payment has been confirmed for your booking.",
              actionHref: "/provider/jobs",
              metadata: { provider: "mpesa", checkoutRequestId, bookingId: tx.bookingId },
            })
          }
        }
      }
    } else {
      await db.paymentTransaction.create({
        data: {
          provider: "mpesa",
          kind: "callback",
          status: resultCode === 0 ? "SUCCESS" : "FAILED",
          response: serializePayload(payload),
          error: resultCode === 0 ? null : resultDesc,
        },
      })
    }

    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    })
  } catch {
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    })
  }
}
