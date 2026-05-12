import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { createInAppNotification } from "@/lib/server/in-app-notifications"
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth"
import { sendSms } from "@/lib/server/sms"

const prismaDb: any = db

type AnnouncementStatus = "draft" | "sent" | "scheduled"

function safeParse(value: string | null) {
  if (!value) return null
  try {
    return JSON.parse(value) as Record<string, unknown>
  } catch {
    return null
  }
}

function normalizeAudience(value: unknown) {
  const audience = String(value || "All Users").trim()
  return audience || "All Users"
}

function normalizeStatus(value: unknown): AnnouncementStatus {
  const status = String(value || "draft").trim().toLowerCase()
  if (status === "sent" || status === "scheduled") return status
  return "draft"
}

function recipientRolesForAudience(audience: string) {
  switch (audience) {
    case "Providers":
      return ["provider"]
    case "Shopkeepers":
      return ["shopkeeper"]
    case "Customers":
      return ["customer"]
    case "Agents":
      return ["agent"]
    case "Internal Team":
      return ["admin", "sub-admin", "subadmin", "secretary", "agent"]
    case "All Users":
    default:
      return ["customer", "provider", "shopkeeper", "admin", "sub-admin", "subadmin", "secretary", "agent"]
  }
}

async function loadRecipients(audience: string) {
  const roles = recipientRolesForAudience(audience)
  return prismaDb.user.findMany({
    where: {
      deletedAt: null,
      role: { in: roles },
    },
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
      phone: true,
    },
  })
}

async function broadcastToRecipients(params: {
  title: string
  message: string
  audience: string
  actionHref?: string
  senderId: string
}) {
  const recipients = await loadRecipients(params.audience)
  const phoneRecipients = recipients
    .map((recipient: any) => String(recipient.phone || "").trim())
    .filter(Boolean)

  await Promise.all(
    recipients.map((recipient: any) =>
      createInAppNotification({
        userId: recipient.id,
        type: "system",
        title: params.title,
        message: params.message,
        actionHref: params.actionHref,
        metadata: {
          audience: params.audience,
          senderId: params.senderId,
          recipientRole: recipient.role,
        },
      }),
    ),
  )

  if (phoneRecipients.length > 0) {
    const smsMessage = `${params.title}: ${params.message}`.slice(0, 160)
    try {
      await sendSms(phoneRecipients, smsMessage)
    } catch {
      // Keep announcement delivery resilient if SMS is unavailable.
    }
  }

  return {
    recipientCount: recipients.length,
    inAppCount: recipients.length,
    smsCount: phoneRecipients.length,
    deliveryChannels: ["in-app", ...(phoneRecipients.length > 0 ? ["sms"] : [])],
  }
}

export async function GET(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request)
    if (error || !actor) return error

    if (!hasAnyRole(actor, ["admin", "sub-admin", "subadmin", "secretary"])) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
    }

    const rows = await prismaDb.authLog.findMany({
      where: {
        provider: "system",
        mode: "announcement",
        status: "SUCCESS",
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        email: true,
        response: true,
        createdAt: true,
      },
    })

    const announcements = rows.map((row: any) => {
      const payload = safeParse(row.response) || {}
      return {
        id: row.id,
        title: String(payload.title || "Announcement"),
        message: String(payload.message || ""),
        audience: String(payload.audience || "All Users"),
        status: normalizeStatus(payload.status),
        sentAt: payload.sentAt ? String(payload.sentAt) : row.createdAt.toISOString(),
        views: Number(payload.recipientCount || 0),
        type: String(payload.type || "general"),
        deliveryChannels: Array.isArray(payload.deliveryChannels)
          ? payload.deliveryChannels.map((channel: unknown) => String(channel))
          : [],
      }
    })

    return NextResponse.json({ ok: true, data: announcements })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch announcements"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request)
    if (error || !actor) return error

    if (!hasAnyRole(actor, ["admin", "sub-admin", "subadmin", "secretary"])) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const title = String(body?.title || "").trim()
    const message = String(body?.message || "").trim()
    const audience = normalizeAudience(body?.audience)
    const status = normalizeStatus(body?.status)
    const type = String(body?.type || "general").trim().toLowerCase() || "general"
    const actionHref = body?.actionHref ? String(body.actionHref).trim() : undefined

    if (!title || !message) {
      return NextResponse.json({ ok: false, error: "title and message are required" }, { status: 400 })
    }

    const announcement = {
      title,
      message,
      audience,
      status,
      type,
      actionHref: actionHref || null,
      senderId: actor.id,
      senderEmail: actor.email,
      recipientCount: 0,
      inAppCount: 0,
      smsCount: 0,
      deliveryChannels: [] as string[],
      sentAt: status === "sent" ? new Date().toISOString() : null,
    }

    const row = await prismaDb.authLog.create({
      data: {
        provider: "system",
        mode: "announcement",
        email: actor.id,
        status: "SUCCESS",
        response: JSON.stringify(announcement),
      },
    })

    let recipientCount = 0
    if (status === "sent") {
      const delivery = await broadcastToRecipients({
        title,
        message,
        audience,
        actionHref,
        senderId: actor.id,
      })
      recipientCount = delivery.recipientCount

      await prismaDb.authLog.update({
        where: { id: row.id },
        data: {
          response: JSON.stringify({
            ...announcement,
            recipientCount,
            inAppCount: delivery.inAppCount,
            smsCount: delivery.smsCount,
            deliveryChannels: delivery.deliveryChannels,
            sentAt: new Date().toISOString(),
          }),
        },
      })
    }

    return NextResponse.json({
      ok: true,
      data: {
        id: row.id,
        ...announcement,
        recipientCount,
        deliveryChannels: announcement.deliveryChannels,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create announcement"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request)
    if (error || !actor) return error

    if (!hasAnyRole(actor, ["admin", "sub-admin", "subadmin", "secretary"])) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const id = String(body?.id || "").trim()
    const action = String(body?.action || "").trim().toLowerCase()

    if (!id || !action) {
      return NextResponse.json({ ok: false, error: "id and action are required" }, { status: 400 })
    }

    const row = await prismaDb.authLog.findFirst({
      where: {
        id,
        provider: "system",
        mode: "announcement",
        status: "SUCCESS",
      },
      select: { id: true, response: true },
    })

    if (!row) {
      return NextResponse.json({ ok: false, error: "Announcement not found" }, { status: 404 })
    }

    const payload = safeParse(row.response) || {}

    if (action === "send") {
      if (String(payload.status || "draft") === "sent") {
        return NextResponse.json({
          ok: true,
          data: {
            id,
            recipientCount: Number(payload.recipientCount || 0),
            deliveryChannels: Array.isArray(payload.deliveryChannels) ? payload.deliveryChannels : ["in-app"],
          },
        })
      }

      const delivery = await broadcastToRecipients({
        title: String(payload.title || "Announcement"),
        message: String(payload.message || ""),
        audience: String(payload.audience || "All Users"),
        actionHref: payload.actionHref ? String(payload.actionHref) : undefined,
        senderId: String(payload.senderId || actor.id),
      })

      await prismaDb.authLog.update({
        where: { id },
        data: {
          response: JSON.stringify({
            ...payload,
            status: "sent",
            recipientCount: delivery.recipientCount,
            inAppCount: delivery.inAppCount,
            smsCount: delivery.smsCount,
            deliveryChannels: delivery.deliveryChannels,
            sentAt: new Date().toISOString(),
          }),
        },
      })

      return NextResponse.json({
        ok: true,
        data: {
          id,
          recipientCount: delivery.recipientCount,
          deliveryChannels: delivery.deliveryChannels,
        },
      })
    }

    if (action === "delete") {
      await prismaDb.authLog.delete({ where: { id } })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update announcement"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}