import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"

const prismaDb: any = db

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get("customerId")
    const providerId = searchParams.get("providerId")

    const bookings = await prismaDb.booking.findMany({
      where: {
        ...(customerId ? { customerId } : {}),
        ...(providerId ? { providerId } : {}),
      },
      include: {
        customer: { select: { name: true, email: true } },
        provider: { select: { name: true, email: true } },
        service: true,
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ ok: true, data: bookings })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch bookings"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customerId, providerId, serviceId, amount, currency } = body

    const booking = await prismaDb.booking.create({
      data: {
        customerId,
        providerId,
        serviceId,
        amount,
        currency,
        status: "pending"
      }
    })

    return NextResponse.json({ ok: true, data: booking })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create booking"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
