import { NextResponse } from "next/server"
import { db, serializePayload } from "@/lib/server/db"

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
