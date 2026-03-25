import { NextResponse } from "next/server"
import { db, serializePayload } from "@/lib/server/db"
import { createInAppNotification } from "@/lib/server/in-app-notifications"

function getWalletUserIdFromReference(reference: string | null | undefined): string | null {
  const value = String(reference || "")
  if (!value.startsWith("WALLET:")) return null

  const segments = value.split(":")
  return segments[1] || null
}

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

        const walletSourceReference = tx?.reference ? String(tx.reference) : null
        const walletUserId = getWalletUserIdFromReference(walletSourceReference)
        const walletTopUpAmount = Math.max(0, Math.round(Number(tx?.amount || 0)))
        if (walletUserId && walletSourceReference && walletTopUpAmount > 0) {
          const credited = await db.$transaction(async (prisma: any) => {
            const creditReference = `${walletSourceReference}:CREDIT:${checkoutRequestId}`
            const existingCredit = await prisma.paymentTransaction.findFirst({
              where: {
                provider: "wallet",
                kind: "deposit",
                reference: creditReference,
              },
              select: { id: true },
            })

            if (existingCredit) {
              return false
            }

            const wallet = await prisma.wallet.upsert({
              where: { userId: walletUserId },
              update: {},
              create: {
                userId: walletUserId,
                currency: "KES",
                balance: 0,
              },
              select: { balance: true, currency: true },
            })

            const currentBalance = Number(wallet.balance || 0)
            const newBalance = currentBalance + walletTopUpAmount

            await prisma.wallet.update({
              where: { userId: walletUserId },
              data: { balance: newBalance },
            })

            await prisma.paymentTransaction.create({
              data: {
                provider: "wallet",
                kind: "deposit",
                reference: creditReference,
                amount: walletTopUpAmount,
                currency: wallet.currency || "KES",
                status: "SUCCESS",
                request: tx?.request || null,
                response: serializePayload({
                  sourceProvider: "mpesa",
                  sourceTransactionId: tx?.id || null,
                  checkoutRequestId,
                  balanceAfter: newBalance,
                }),
              },
            })

            return true
          })

          if (credited) {
            await createInAppNotification({
              userId: walletUserId,
              type: "payment",
              title: "Wallet funded",
              message: `KES ${walletTopUpAmount.toLocaleString()} has been added to your wallet.`,
              actionHref: "/customer/wallet",
              metadata: { provider: "mpesa", checkoutRequestId },
            })
          }
        }

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
