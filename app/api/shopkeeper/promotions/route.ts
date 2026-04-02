import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { getSessionFromRequest } from "@/lib/server/session"

const prismaDb: any = db

const DEFAULT_PROMOTIONS = [
      {
        id: 1,
        name: "New Year Sale",
        code: "NEWYEAR25",
        type: "percentage",
        value: 25,
        minOrder: 5000,
        maxUses: 100,
        usedCount: 67,
        startDate: "2026-01-01",
        endDate: "2026-01-31",
        status: "active",
        products: "All Products",
        description: "New Year special discount on all products",
      },
      {
        id: 2,
        name: "Electronics Flash Sale",
        code: "ELECTRO15",
        type: "percentage",
        value: 15,
        minOrder: 10000,
        maxUses: 50,
        usedCount: 23,
        startDate: "2026-02-01",
        endDate: "2026-02-28",
        status: "active",
        products: "Electronics",
        description: "Discount on all electronics category items",
      },
      {
        id: 3,
        name: "First Order Discount",
        code: "WELCOME500",
        type: "fixed",
        value: 500,
        minOrder: 2000,
        maxUses: 500,
        usedCount: 312,
        startDate: "2026-01-15",
        endDate: "2026-06-30",
        status: "active",
        products: "All Products",
        description: "KES 500 off for first-time customers",
      },
      {
        id: 4,
        name: "Valentine's Deal",
        code: "LOVE2026",
        type: "percentage",
        value: 20,
        minOrder: 3000,
        maxUses: 200,
        usedCount: 200,
        startDate: "2026-02-10",
        endDate: "2026-02-14",
        status: "expired",
        products: "Home Decor",
        description: "Valentine's Day special offer",
      },
      {
        id: 5,
        name: "March Madness",
        code: "MARCH30",
        type: "percentage",
        value: 30,
        minOrder: 8000,
        maxUses: 75,
        usedCount: 0,
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        status: "scheduled",
        products: "Appliances",
        description: "Upcoming March promotion on appliances",
      },
    ]

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
      // Promotion table may not exist yet, use defaults
      console.log("Promotion table not available, using defaults")
    }

    // Fall back to defaults if no database records
    if (promotions.length === 0) {
      promotions = DEFAULT_PROMOTIONS
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
