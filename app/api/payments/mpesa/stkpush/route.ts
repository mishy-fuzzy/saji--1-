import { NextResponse } from "next/server"
import { initiateStkPush } from "@/lib/server/mpesa"
import { db, serializePayload } from "@/lib/server/db"

export async function POST(request: Request) {
  let requestBody: unknown = null
  try {
    const body = await request.json()
    requestBody = body
    const phone = String(body?.phone || "").trim()
    const amount = Number(body?.amount)
    const accountReference = String(body?.accountReference || "SAJI").trim()
    const transactionDesc = String(body?.transactionDesc || "Service payment").trim()
    const bookingId = body?.bookingId ? String(body.bookingId) : null

    if (!phone) {
      return NextResponse.json({ error: "phone is required" }, { status: 400 })
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "amount must be greater than 0" }, { status: 400 })
    }

    const result = await initiateStkPush({
      phone,
      amount,
      accountReference,
      transactionDesc,
    })

    const transaction = await db.paymentTransaction.create({
      data: {
        provider: "mpesa",
        kind: "stkpush",
        reference: accountReference,
        externalId: result?.CheckoutRequestID || null,
        amount: Math.round(amount),
        currency: "KES",
        status: result?.ResponseCode === "0" ? "PENDING" : "FAILED",
        request: serializePayload(requestBody),
        response: serializePayload(result),
        bookingId: bookingId,
      },
    })

    return NextResponse.json({ ok: true, data: result, transactionId: transaction.id })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to initiate STK push"

    try {
      await db.paymentTransaction.create({
        data: {
          provider: "mpesa",
          kind: "stkpush",
          status: "FAILED",
          request: serializePayload(requestBody),
          error: message,
        },
      })
    } catch {
      // Avoid shadowing original API error when DB write fails.
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
