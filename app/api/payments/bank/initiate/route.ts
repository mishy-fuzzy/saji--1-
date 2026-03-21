import { NextResponse } from "next/server"
import { initiateBankTransfer } from "@/lib/server/bank"
import { db, serializePayload } from "@/lib/server/db"

export async function POST(request: Request) {
  let requestBody: unknown = null
  try {
    const body = await request.json()
    requestBody = body

    const amount = Number(body?.amount)
    const currency = String(body?.currency || "KES")
    const payerName = String(body?.payerName || "").trim()
    const payerPhone = body?.payerPhone ? String(body.payerPhone) : undefined
    const payerEmail = body?.payerEmail ? String(body.payerEmail) : undefined
    const reference = String(body?.reference || "SAJI-BOOKING")

    const result = await initiateBankTransfer({
      amount,
      currency,
      payerName,
      payerPhone,
      payerEmail,
      reference,
    })

    await db.paymentTransaction.create({
      data: {
        provider: "bank",
        kind: "transfer",
        reference,
        externalId: result.transferReference,
        amount: Math.round(amount),
        currency,
        status: result.status,
        request: serializePayload(requestBody),
        response: serializePayload(result),
      },
    })

    return NextResponse.json({ ok: true, data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to initiate bank transfer"

    try {
      await db.paymentTransaction.create({
        data: {
          provider: "bank",
          kind: "transfer",
          status: "FAILED",
          request: serializePayload(requestBody),
          error: message,
        },
      })
    } catch {
      // Keep API response behavior stable when DB logging fails.
    }

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
