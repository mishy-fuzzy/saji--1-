import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: "booking id is required" }, { status: 400 })
    }

    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true, image: true } },
        provider: { select: { id: true, name: true, email: true, phone: true, image: true } },
        service: true,
        paymentTransactions: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ ok: true, data: null })
    }

    return NextResponse.json({ ok: true, data: booking })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch booking"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
