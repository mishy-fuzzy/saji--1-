import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    // Virtual gifts/coins with pricing
    const gifts = [
      { id: 1, name: "Thumbs Up", icon: "👍", price: 10 },
      { id: 2, name: "Clap", icon: "👏", price: 20 },
      { id: 3, name: "Heart", icon: "❤️", price: 50 },
      { id: 4, name: "Fire", icon: "🔥", price: 100 },
      { id: 5, name: "Star", icon: "⭐", price: 200 },
      { id: 6, name: "Diamond", icon: "💎", price: 500 },
      { id: 7, name: "Crown", icon: "👑", price: 1000 },
      { id: 8, name: "Rocket", icon: "🚀", price: 2000 },
    ]

    return NextResponse.json({
      ok: true,
      data: gifts,
    })
  } catch (error) {
    console.error("Virtual gifts error:", error)
    return NextResponse.json(
      { ok: false, error: "Failed to fetch virtual gifts" },
      { status: 500 }
    )
  }
}
