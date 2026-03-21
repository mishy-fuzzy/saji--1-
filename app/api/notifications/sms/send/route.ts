import { NextResponse } from "next/server"
import { sendSms } from "@/lib/server/sms"
import { db, serializePayload } from "@/lib/server/db"

export async function POST(request: Request) {
  let requestBody: unknown = null
  try {
    const body = await request.json()
    requestBody = body
    const to = body?.to
    const message = String(body?.message || "")

    const hasRecipients =
      (typeof to === "string" && to.trim().length > 0) ||
      (Array.isArray(to) && to.length > 0)

    if (!hasRecipients) {
      return NextResponse.json({ error: "to is required" }, { status: 400 })
    }

    if (!message.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 })
    }

    const result = await sendSms(to, message)

    await db.notificationLog.create({
      data: {
        provider: "africastalking",
        channel: "sms",
        recipient: Array.isArray(to) ? to.join(",") : String(to),
        message,
        status: "SENT",
        response: serializePayload(result),
      },
    })

    return NextResponse.json({ ok: true, data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send SMS"

    try {
      const to = (requestBody as { to?: unknown } | null)?.to
      const recipient = Array.isArray(to) ? to.join(",") : String(to || "unknown")
      const text = String((requestBody as { message?: unknown } | null)?.message || "")

      await db.notificationLog.create({
        data: {
          provider: "africastalking",
          channel: "sms",
          recipient,
          message: text,
          status: "FAILED",
          error: message,
        },
      })
    } catch {
      // Keep API response behavior stable when DB logging fails.
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
