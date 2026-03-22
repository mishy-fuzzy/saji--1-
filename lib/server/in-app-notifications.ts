import { db } from "@/lib/server/db"

export type InAppNotification = {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  actionHref?: string
  createdAt: string
}

export async function createInAppNotification(params: {
  userId: string
  type: string
  title: string
  message: string
  actionHref?: string
  metadata?: Record<string, unknown>
}) {
  const payload = {
    type: params.type,
    title: params.title,
    message: params.message,
    read: false,
    actionHref: params.actionHref || null,
    metadata: params.metadata || null,
  }

  return db.authLog.create({
    data: {
      provider: "system",
      mode: "notification",
      email: params.userId,
      status: "SUCCESS",
      response: JSON.stringify(payload),
    },
  })
}

function safeParse(value: string | null) {
  if (!value) return null
  try {
    return JSON.parse(value) as Record<string, unknown>
  } catch {
    return null
  }
}

export function mapAuthLogToNotification(row: {
  id: string
  response: string | null
  createdAt: Date
}): InAppNotification {
  const payload = safeParse(row.response) || {}
  return {
    id: row.id,
    type: String(payload.type || "system"),
    title: String(payload.title || "Notification"),
    message: String(payload.message || ""),
    read: Boolean(payload.read),
    actionHref: payload.actionHref ? String(payload.actionHref) : undefined,
    createdAt: row.createdAt.toISOString(),
  }
}
