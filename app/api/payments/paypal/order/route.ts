import { NextResponse } from "next/server"
import { createPayPalOrder } from "@/lib/server/paypal"
import { db, serializePayload } from "@/lib/server/db"

export async function POST(request: Request) {
  let requestBody: unknown = null
  try {
    const body = await request.json()
    requestBody = body
    const amount = Number(body?.amount)
    const currency = String(body?.currency || "USD")
    const reference = String(body?.reference || "SAJI-BOOKING")
    const bookingId = body?.bookingId ? String(body.bookingId) : null

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "amount must be greater than 0" }, { status: 400 })
    }

    const order = await createPayPalOrder({ amount, currency, reference })
    const approveLink = Array.isArray(order?.links)
      ? order.links.find((link: { rel?: string; href?: string }) => link.rel === "approve")?.href
      : undefined

    await db.paymentTransaction.create({
      data: {
        provider: "paypal",
        kind: "order",
        reference,
        externalId: order.id,
        amount: Math.round(amount),
        currency,
        status: String(order.status || "CREATED").toUpperCase(),
        request: serializePayload(requestBody),
        response: serializePayload(order),
        bookingId,
      },
    })

    return NextResponse.json({
      ok: true,
      data: {
        id: order.id,
        status: order.status,
        approveUrl: approveLink || null,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create PayPal order"

    try {
      await db.paymentTransaction.create({
        data: {
          provider: "paypal",
          kind: "order",
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
