import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { createInAppNotification } from "@/lib/server/in-app-notifications"
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth"
import { resolveAppUrlFromRequest } from "@/lib/server/app-url"
import { sendEmail } from "@/lib/server/mailer"
import { sendSms } from "@/lib/server/sms"

const prismaDb: any = db

type AnnouncementStatus = "draft" | "sent" | "scheduled"
const DEFAULT_CHANNELS = ["in-app", "email"]
const ALLOWED_CHANNELS = new Set(["in-app", "sms", "email"])

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

function normalizeChannels(value: unknown): string[] {
  if (!Array.isArray(value)) return DEFAULT_CHANNELS

  const channels = value
    .map((channel) => String(channel || "").trim().toLowerCase())
    .filter((channel) => ALLOWED_CHANNELS.has(channel))

  const unique = Array.from(new Set(channels))
  return unique.length > 0 ? unique : DEFAULT_CHANNELS
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

function hasSmtpConfig() {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim(),
  )
}

function resolveActionUrl(appUrl: string, actionHref?: string) {
  if (!actionHref) return null
  try {
    return new URL(actionHref, appUrl).toString()
  } catch {
    return actionHref
  }
}

function buildAnnouncementEmail(params: {
  title: string
  message: string
  recipientName?: string
  actionUrl?: string | null
}) {
  const safeName = params.recipientName?.trim() || "there"
  const subject = `SAJI Announcement: ${params.title}`
  const actionText = params.actionUrl
    ? `\n\nOpen: ${params.actionUrl}`
    : ""

  const text = `Hello ${safeName},\n\n${params.message}${actionText}\n`
  const actionHtml = params.actionUrl
    ? `<p><a href="${params.actionUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;">Open Announcement</a></p>`
    : ""
  const html = `
    <p>Hello ${safeName},</p>
    <p>${params.message}</p>
    ${actionHtml}
  `

  return { subject, text, html }
}

async function sendAnnouncementEmail(params: {
  recipientEmail: string
  recipientName?: string
  title: string
  message: string
  actionUrl?: string | null
}) {
  const email = buildAnnouncementEmail({
    title: params.title,
    message: params.message,
    recipientName: params.recipientName,
    actionUrl: params.actionUrl,
  })

  try {
    const result = await sendEmail({
      to: params.recipientEmail,
      subject: email.subject,
      text: email.text,
      html: email.html,
    })

    await prismaDb.notificationLog.create({
      data: {
        provider: "smtp",
        channel: "email",
        recipient: params.recipientEmail,
        message: email.subject,
        status: "SENT",
        response: JSON.stringify(result),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email send failed"
    await prismaDb.notificationLog.create({
      data: {
        provider: "smtp",
        channel: "email",
        recipient: params.recipientEmail,
        message: email.subject,
        status: "FAILED",
        error: message,
      },
    })
    throw error
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
  appUrl: string
  channels: string[]
}) {
  const recipients = await loadRecipients(params.audience)
  const actionUrl = resolveActionUrl(params.appUrl, params.actionHref)
  const requestedChannels = normalizeChannels(params.channels)
  const shouldSendInApp = requestedChannels.includes("in-app")
  const shouldSendSms = requestedChannels.includes("sms")
  const shouldSendEmail = requestedChannels.includes("email")
  const phoneRecipients = recipients
    .map((recipient: any) => String(recipient.phone || "").trim())
    .filter(Boolean)
  const emailRecipients = shouldSendEmail && hasSmtpConfig()
    ? recipients
        .map((recipient: any) => ({
          email: String(recipient.email || "").trim(),
          name: String(recipient.name || "").trim(),
        }))
        .filter((recipient: { email: string }) => recipient.email.length > 0)
    : []

  let inAppCount = 0
  if (shouldSendInApp) {
    const inAppResults = await Promise.allSettled(
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

    inAppCount = inAppResults.filter((result) => result.status === "fulfilled").length
  }

  let emailCount = 0
  if (emailRecipients.length > 0) {
    const emailResults = await Promise.allSettled(
      emailRecipients.map((recipient) =>
        sendAnnouncementEmail({
          recipientEmail: recipient.email,
          recipientName: recipient.name,
          title: params.title,
          message: params.message,
          actionUrl,
        }),
      ),
    )

    emailCount = emailResults.filter((result) => result.status === "fulfilled").length
  }

  let smsCount = 0
  if (shouldSendSms && phoneRecipients.length > 0) {
    const smsMessage = `${params.title}: ${params.message}`.slice(0, 160)
    try {
      await sendSms(phoneRecipients, smsMessage)
      smsCount = phoneRecipients.length
    } catch {
      // Keep announcement delivery resilient if SMS is unavailable.
    }
  }

  const deliveryChannels = [
    ...(inAppCount > 0 ? ["in-app"] : []),
    ...(smsCount > 0 ? ["sms"] : []),
    ...(emailCount > 0 ? ["email"] : []),
  ]

  return {
    recipientCount: recipients.length,
    inAppCount,
    smsCount,
    emailCount,
    requestedChannels,
    deliveryChannels,
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
        scheduledFor: payload.scheduledFor ? String(payload.scheduledFor) : null,
        views: Number(payload.recipientCount || 0),
        type: String(payload.type || "general"),
        requestedChannels: Array.isArray(payload.requestedChannels)
          ? payload.requestedChannels.map((channel: unknown) => String(channel))
          : normalizeChannels(payload.channels ?? payload.deliveryChannels),
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
    const requestedChannels = normalizeChannels(body?.channels)
    const type = String(body?.type || "general").trim().toLowerCase() || "general"
    const actionHref = body?.actionHref ? String(body.actionHref).trim() : undefined
    const scheduledForRaw = body?.scheduledFor ? String(body.scheduledFor).trim() : ""
    const scheduledFor = scheduledForRaw ? new Date(scheduledForRaw) : null

    if (!title || !message) {
      return NextResponse.json({ ok: false, error: "title and message are required" }, { status: 400 })
    }

    if (status === "scheduled") {
      if (!scheduledFor || Number.isNaN(scheduledFor.getTime())) {
        return NextResponse.json({ ok: false, error: "scheduledFor is required" }, { status: 400 })
      }

      if (scheduledFor.getTime() <= Date.now()) {
        return NextResponse.json({ ok: false, error: "scheduledFor must be in the future" }, { status: 400 })
      }
    }

    if (requestedChannels.length === 0) {
      return NextResponse.json({ ok: false, error: "Select at least one delivery channel" }, { status: 400 })
    }

    const announcement = {
      title,
      message,
      audience,
      status,
      type,
      actionHref: actionHref || null,
      scheduledFor: status === "scheduled" ? scheduledFor?.toISOString() : null,
      requestedChannels,
      senderId: actor.id,
      senderEmail: actor.email,
      recipientCount: 0,
      inAppCount: 0,
      smsCount: 0,
      emailCount: 0,
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
    let deliveryChannels = announcement.deliveryChannels
    if (status === "sent") {
      const delivery = await broadcastToRecipients({
        title,
        message,
        audience,
        actionHref,
        senderId: actor.id,
        appUrl: resolveAppUrlFromRequest(request),
        channels: requestedChannels,
      })
      recipientCount = delivery.recipientCount
      deliveryChannels = delivery.deliveryChannels

      await prismaDb.authLog.update({
        where: { id: row.id },
        data: {
          response: JSON.stringify({
            ...announcement,
            recipientCount,
            inAppCount: delivery.inAppCount,
            smsCount: delivery.smsCount,
            emailCount: delivery.emailCount,
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
        deliveryChannels,
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

    if (!action || (!id && action !== "dispatch-scheduled")) {
      return NextResponse.json({ ok: false, error: "id and action are required" }, { status: 400 })
    }

    if (action === "dispatch-scheduled") {
      const rows = await prismaDb.authLog.findMany({
        where: {
          provider: "system",
          mode: "announcement",
          status: "SUCCESS",
        },
        orderBy: { createdAt: "desc" },
        take: 200,
        select: { id: true, response: true },
      })

      const now = Date.now()
      let processed = 0

      for (const record of rows) {
        const payload = safeParse(record.response) || {}
        if (String(payload.status || "") !== "scheduled") continue

        const scheduledFor = payload.scheduledFor ? new Date(String(payload.scheduledFor)) : null
        if (!scheduledFor || Number.isNaN(scheduledFor.getTime())) continue
        if (scheduledFor.getTime() > now) continue

        const delivery = await broadcastToRecipients({
          title: String(payload.title || "Announcement"),
          message: String(payload.message || ""),
          audience: String(payload.audience || "All Users"),
          actionHref: payload.actionHref ? String(payload.actionHref) : undefined,
          senderId: String(payload.senderId || actor.id),
          appUrl: resolveAppUrlFromRequest(request),
          channels: normalizeChannels(payload.requestedChannels ?? payload.channels ?? payload.deliveryChannels),
        })

        await prismaDb.authLog.update({
          where: { id: record.id },
          data: {
            response: JSON.stringify({
              ...payload,
              status: "sent",
              recipientCount: delivery.recipientCount,
              inAppCount: delivery.inAppCount,
              smsCount: delivery.smsCount,
              emailCount: delivery.emailCount,
              deliveryChannels: delivery.deliveryChannels,
              sentAt: new Date().toISOString(),
            }),
          },
        })

        processed += 1
      }

      return NextResponse.json({ ok: true, data: { processed } })
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

      const requestedChannels = normalizeChannels(payload.requestedChannels ?? payload.channels ?? payload.deliveryChannels)
      const delivery = await broadcastToRecipients({
        title: String(payload.title || "Announcement"),
        message: String(payload.message || ""),
        audience: String(payload.audience || "All Users"),
        actionHref: payload.actionHref ? String(payload.actionHref) : undefined,
        senderId: String(payload.senderId || actor.id),
        appUrl: resolveAppUrlFromRequest(request),
        channels: requestedChannels,
      })

      await prismaDb.authLog.update({
        where: { id },
        data: {
          response: JSON.stringify({
            ...payload,
            status: "sent",
            requestedChannels,
            recipientCount: delivery.recipientCount,
            inAppCount: delivery.inAppCount,
            smsCount: delivery.smsCount,
            emailCount: delivery.emailCount,
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