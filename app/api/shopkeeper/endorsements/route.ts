import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { getSessionFromRequest } from "@/lib/server/session"

const prismaDb: any = db

function safeString(value: unknown): string {
  return String(value || "").trim()
}

function safeJsonParse(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "string" || !value.trim()) return null
  try {
    return JSON.parse(value) as Record<string, unknown>
  } catch {
    return null
  }
}

async function readFallbackData(userId: string) {
  const [requestRows, endorsementRows] = await Promise.all([
    prismaDb.authLog.findMany({
      where: {
        provider: "local",
        mode: "shopkeeper-endorsement-request",
        email: userId,
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, createdAt: true, response: true },
    }),
    prismaDb.authLog.findMany({
      where: {
        provider: "local",
        mode: "shopkeeper-endorsement",
        email: userId,
        status: { not: "DELETED" },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, createdAt: true, response: true },
    }),
  ])

  const pendingRequests = requestRows
    .map((row: any) => {
      const payload = safeJsonParse(row?.response)
      if (!payload) return null
      return {
        id: String(row.id),
        name: safeString(payload.name) || "Specialist",
        avatar: safeString(payload.avatar) || "/placeholder.svg",
        specialty: safeString(payload.specialty) || "Service Provider",
        location: safeString(payload.location) || "Unknown",
        rating: Number(payload.rating || 0),
        reviews: Number(payload.reviews || 0),
        yearsKnown: Number(payload.yearsKnown || 0),
        message: safeString(payload.message) || "Would appreciate your endorsement",
        requestedAt: row.createdAt,
      }
    })
    .filter(Boolean)

  const myEndorsements = endorsementRows
    .map((row: any) => {
      const payload = safeJsonParse(row?.response)
      if (!payload) return null
      return {
        id: String(row.id),
        name: safeString(payload.name) || "Specialist",
        avatar: safeString(payload.avatar) || "/placeholder.svg",
        specialty: safeString(payload.specialty) || "Service Provider",
        endorsement: safeString(payload.endorsement) || "Great professional",
        endorsedAt: payload.endorsedAt || row.createdAt,
        views: Number(payload.views || 0),
      }
    })
    .filter(Boolean)

  return { pendingRequests, myEndorsements }
}

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

    // Fallback to authLog pseudo-store if dedicated tables are unavailable/empty.
    if (pendingRequests.length === 0 && myEndorsements.length === 0) {
      const fallback = await readFallbackData(session.userId)
      pendingRequests = fallback.pendingRequests
      myEndorsements = fallback.myEndorsements
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
        pendingRequests,
        myEndorsements,
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

export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request)
    if (!session?.userId || session.role !== "shopkeeper") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const requestId = safeString(body?.requestId)
    const endorsementText = safeString(body?.endorsementText)

    if (!requestId || endorsementText.length < 20) {
      return NextResponse.json(
        { ok: false, error: "A valid requestId and endorsement text are required" },
        { status: 400 },
      )
    }

    try {
      const dbRequest = await prismaDb.endorsementRequest.findFirst({
        where: {
          id: requestId,
          requestedTo: session.userId,
          status: "pending",
        },
        include: {
          requestedBy: { select: { id: true, name: true, image: true } },
        },
      })

      if (dbRequest) {
        const created = await prismaDb.endorsement.create({
          data: {
            endorsedBy: session.userId,
            endorsedUserId: String(dbRequest.requestedBy?.id || ""),
            specialty: dbRequest.specialty || "Service Provider",
            text: endorsementText,
            status: "approved",
          },
          include: {
            endorsedUser: { select: { id: true, name: true, image: true } },
          },
        })

        await prismaDb.endorsementRequest.update({
          where: { id: requestId },
          data: { status: "approved" },
        })

        return NextResponse.json({
          ok: true,
          data: {
            id: String(created.id),
            name: created.endorsedUser?.name || "Specialist",
            avatar: created.endorsedUser?.image || "/placeholder.svg",
            specialty: created.specialty || "Service Provider",
            endorsement: created.text || endorsementText,
            endorsedAt: created.createdAt,
            views: Number(created.views || 0),
          },
        })
      }
    } catch {
      // Fall back to authLog persistence below.
    }

    const [requestRow] = await prismaDb.authLog.findMany({
      where: {
        id: requestId,
        provider: "local",
        mode: "shopkeeper-endorsement-request",
        email: session.userId,
        status: "PENDING",
      },
      take: 1,
      select: { id: true, response: true },
    })

    if (!requestRow) {
      return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 })
    }

    const requestPayload = safeJsonParse(requestRow.response) || {}
    const created = await prismaDb.authLog.create({
      data: {
        provider: "local",
        mode: "shopkeeper-endorsement",
        email: session.userId,
        status: "APPROVED",
        response: JSON.stringify({
          name: safeString(requestPayload.name) || "Specialist",
          avatar: safeString(requestPayload.avatar) || "/placeholder.svg",
          specialty: safeString(requestPayload.specialty) || "Service Provider",
          endorsement: endorsementText,
          endorsedAt: new Date().toISOString(),
          views: 0,
        }),
      },
      select: { id: true, createdAt: true },
    })

    await prismaDb.authLog.update({
      where: { id: requestRow.id },
      data: { status: "APPROVED" },
    })

    return NextResponse.json({
      ok: true,
      data: {
        id: String(created.id),
        name: safeString(requestPayload.name) || "Specialist",
        avatar: safeString(requestPayload.avatar) || "/placeholder.svg",
        specialty: safeString(requestPayload.specialty) || "Service Provider",
        endorsement: endorsementText,
        endorsedAt: created.createdAt,
        views: 0,
      },
    })
  } catch (error) {
    console.error("Shopkeeper endorsements POST error:", error)
    return NextResponse.json(
      { ok: false, error: "Failed to submit endorsement" },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = getSessionFromRequest(request)
    if (!session?.userId || session.role !== "shopkeeper") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const action = safeString(body?.action).toLowerCase()
    const id = safeString(body?.id)

    if (!action || !id) {
      return NextResponse.json({ ok: false, error: "action and id are required" }, { status: 400 })
    }

    if (action === "decline") {
      try {
        await prismaDb.endorsementRequest.updateMany({
          where: {
            id,
            requestedTo: session.userId,
            status: "pending",
          },
          data: {
            status: "declined",
          },
        })
      } catch {
        // fallback below
      }

      const row = await prismaDb.authLog.findFirst({
        where: {
          id,
          provider: "local",
          mode: "shopkeeper-endorsement-request",
          email: session.userId,
          status: "PENDING",
        },
        select: { id: true },
      })

      if (row) {
        await prismaDb.authLog.update({
          where: { id: row.id },
          data: { status: "DECLINED" },
        })
      }

      return NextResponse.json({ ok: true })
    }

    if (action === "edit") {
      const endorsementText = safeString(body?.endorsementText)
      if (endorsementText.length < 20) {
        return NextResponse.json(
          { ok: false, error: "Endorsement text must be at least 20 characters" },
          { status: 400 },
        )
      }

      try {
        const updated = await prismaDb.endorsement.updateMany({
          where: {
            id,
            endorsedBy: session.userId,
          },
          data: {
            text: endorsementText,
          },
        })

        if (Number(updated.count || 0) > 0) {
          return NextResponse.json({ ok: true })
        }
      } catch {
        // fallback below
      }

      const row = await prismaDb.authLog.findFirst({
        where: {
          id,
          provider: "local",
          mode: "shopkeeper-endorsement",
          email: session.userId,
          status: { not: "DELETED" },
        },
        select: { id: true, response: true },
      })

      if (!row) {
        return NextResponse.json({ ok: false, error: "Endorsement not found" }, { status: 404 })
      }

      const payload = safeJsonParse(row.response) || {}
      payload.endorsement = endorsementText

      await prismaDb.authLog.update({
        where: { id: row.id },
        data: {
          response: JSON.stringify(payload),
        },
      })

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: false, error: "Unsupported action" }, { status: 400 })
  } catch (error) {
    console.error("Shopkeeper endorsements PATCH error:", error)
    return NextResponse.json(
      { ok: false, error: "Failed to update endorsement" },
      { status: 500 },
    )
  }
}
