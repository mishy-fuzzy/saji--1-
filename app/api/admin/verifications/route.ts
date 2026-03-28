import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"

export async function GET() {
  const verifications = await db.verification.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    take: 200,
  })

  return NextResponse.json({ ok: true, verifications })
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { verificationId, status, notes } = body

    if (!verificationId || !status) {
      return NextResponse.json(
        { error: "verificationId and status are required" },
        { status: 400 },
      )
    }

    // status can be "approved", "rejected", or "pending"
    if (!["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Use 'approved', 'rejected', or 'pending'" },
        { status: 400 },
      )
    }

    // Get the verification record
    const verification = await db.verification.findUnique({
      where: { id: verificationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    })

    if (!verification) {
      return NextResponse.json(
        { error: "Verification not found" },
        { status: 404 },
      )
    }

    // Update the verification
    const updatedVerification = await db.verification.update({
      where: { id: verificationId },
      data: {
        status,
        notes: notes || verification.notes,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    })

    return NextResponse.json({
      ok: true,
      message: `Verification ${status}`,
      verification: updatedVerification,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update verification"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
