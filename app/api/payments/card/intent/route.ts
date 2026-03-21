import { NextResponse } from "next/server"
import { createCardPaymentIntent } from "@/lib/server/stripe"
import { db, serializePayload } from "@/lib/server/db"

export async function POST(request: Request) {
  let requestBody: unknown = null
  try {
    const body = await request.json()
    requestBody = body
    const amount = Number(body?.amount)
    const currency = String(body?.currency || "KES")
    const email = body?.email ? String(body.email) : undefined
    const reference = body?.reference ? String(body.reference) : "SAJI-BOOKING"

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "amount must be greater than 0" }, { status: 400 })
    }

    const intent = await createCardPaymentIntent({
      amount,
      currency,
      receiptEmail: email,
      description: "SAJI service payment",
      metadata: { reference },
    })

    await db.paymentTransaction.create({
      data: {
        provider: "stripe",
        kind: "card_intent",
        reference,
        externalId: intent.id,
        amount: Math.round(amount),
        currency,
        status: String(intent.status || "CREATED").toUpperCase(),
        request: serializePayload(requestBody),
        response: serializePayload(intent),
      },
    })

    return NextResponse.json({
      ok: true,
      data: {
        id: intent.id,
        clientSecret: intent.client_secret,
        status: intent.status,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create card intent"

    try {
      await db.paymentTransaction.create({
        data: {
          provider: "stripe",
          kind: "card_intent",
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
