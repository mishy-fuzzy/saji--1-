import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { authorizeRoles } from "@/lib/server/rbac"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get("bookingId")
    const providerId = searchParams.get("providerId")

    const bids = await db.bid.findMany({
      where: {
        ...(bookingId ? { bookingId } : {}),
        ...(providerId ? { providerId } : {}),
      },
      include: {
        provider: { select: { name: true, image: true, phone: true } },
        booking: { include: { service: true } }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ ok: true, data: bids })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch bids"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { providerId, bookingId, amount, currency, note } = body

    if (!providerId || !bookingId || !amount) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 })
    }

    const bid = await db.bid.create({
      data: {
        providerId,
        bookingId,
        amount,
        currency: currency || "KES",
        note,
        status: "pending"
      }
    })

    return NextResponse.json({ ok: true, data: bid })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create bid"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { bidId, status } = body

    if (!bidId || !status) {
      return NextResponse.json({ ok: false, error: "Missing bidId or status" }, { status: 400 })
    }

    const updatedBid = await db.bid.update({
      where: { id: bidId },
      data: { status }
    })

    // If a bid is accepted, we could also update the booking providerId
    if (status === "accepted") {
      await db.booking.update({
        where: { id: updatedBid.bookingId },
        data: { providerId: updatedBid.providerId, status: "assigned" }
      })
    }

    return NextResponse.json({ ok: true, data: updatedBid })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update bid"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}