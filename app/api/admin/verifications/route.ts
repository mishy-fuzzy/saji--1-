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
