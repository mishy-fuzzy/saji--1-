import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/server/db"

const prismaDb: any = db

export async function GET(_req: NextRequest) {
  try {
    // Fetch virtual gifts from database
    const gifts = await prismaDb.virtualGift.findMany({
      select: {
        id: true,
        name: true,
        icon: true,
        price: true,
      },
      orderBy: { price: "asc" },
    })

    // If no gifts found, return empty array (will be loaded later)
    return NextResponse.json({
      ok: true,
      data: gifts || [],
    })
  } catch (error) {
    console.error("Virtual gifts error:", error)
    return NextResponse.json(
      { ok: false, error: "Failed to fetch virtual gifts" },
      { status: 500 }
    )
  }
}
