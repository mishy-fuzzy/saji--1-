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

    // Try to fetch pending endorsement requests from database
    let pendingRequests: any[] = []
    try {
      const dbRequests = await prismaDb.endorsementRequest.findMany({
        where: {
          requestedTo: session.userId,
          status: "pending",
        },
        include: {
          requestedBy: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
      pendingRequests = dbRequests.map((req: any) => ({
        id: req.id,
        name: req.requestedBy?.name || "Specialist",
        avatar: req.requestedBy?.image || "/placeholder.svg",
        specialty: req.specialty || "Service Provider",
        location: req.location || "Unknown",
        rating: Number(req.rating || 0),
        reviews: Number(req.reviews || 0),
        yearsKnown: Number(req.yearsKnown || 0),
        message: req.message || "Would appreciate your endorsement",
        requestedAt: req.createdAt,
      }))
    } catch (err) {
      console.log("EndorsementRequest table not available")
      pendingRequests = []
    }

    // Try to fetch endorsements given by this shopkeeper
    let myEndorsements: any[] = []
    try {
      const dbEndorsements = await prismaDb.endorsement.findMany({
        where: {
          endorsedBy: session.userId,
          status: "approved",
        },
        include: {
          endorsedUser: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
      myEndorsements = dbEndorsements.map((e: any) => ({
        id: e.id,
        name: e.endorsedUser?.name || "Specialist",
        avatar: e.endorsedUser?.image || "/placeholder.svg",
        specialty: e.specialty || "Service Provider",
        endorsement: e.text || "Great professional",
        endorsedAt: e.createdAt,
        views: e.views || 0,
      }))
    } catch (err) {
      console.log("Endorsement table not available")
      myEndorsements = []
    }

    const stats = {
      totalEndorsements: myEndorsements.length,
      pendingRequests: pendingRequests.length,
      totalViews: myEndorsements.reduce((sum: number, e: any) => sum + e.views, 0),
      thisMonth: myEndorsements.length,
    }

    return NextResponse.json({
      ok: true,
      data: {
        pending: pendingRequests,
        endorsements: myEndorsements,
        stats,
      },
    })
  } catch (error) {
    console.error("Shopkeeper endorsements error:", error)
    return NextResponse.json(
      { ok: false, error: "Failed to fetch endorsements" },
      { status: 500 }
    )
  }
}
