import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { getSessionFromRequest } from "@/lib/server/session"

const prismaDb: any = db

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request)
    if (!session?.userId || session.role !== "shopkeeper") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    let promotions: any[] = []
    
    // Try to fetch promotions from database
    try {
      const dbPromotions = await prismaDb.promotion.findMany({
        where: { shopkeeperId: session.userId },
        orderBy: { createdAt: "desc" },
      })
      if (dbPromotions && dbPromotions.length > 0) {
        promotions = dbPromotions.map((p: any) => ({
          id: p.id,
          name: p.name,
          code: p.code,
          type: p.type || "percentage",
          value: p.value || 0,
          minOrder: p.minOrder || 0,
          maxUses: p.maxUses || 0,
          usedCount: p.usedCount || 0,
          startDate: p.startDate ? new Date(p.startDate).toISOString().split("T")[0] : "",
          endDate: p.endDate ? new Date(p.endDate).toISOString().split("T")[0] : "",
          status: p.status || "active",
          products: p.products || "All",
          description: p.description || "",
        }))
      }
    } catch (err) {
      console.log("Promotion table not available")
    }

    return NextResponse.json({
      ok: true,
      data: promotions,
    })
  } catch (error) {
    console.error("Shopkeeper promotions error:", error)
    return NextResponse.json(
      { ok: false, error: "Failed to fetch promotions" },
      { status: 500 }
    )
  }
}
