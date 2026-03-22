import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth"
import { createInAppNotification, mapAuthLogToNotification } from "@/lib/server/in-app-notifications"

const prismaDb: any = db

function safeParse(value: string | null) {
  if (!value) return null
  try {
    return JSON.parse(value) as Record<string, unknown>
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request)
    if (error || !actor) return error

    const { searchParams } = new URL(request.url)
    const unreadOnly = String(searchParams.get("unreadOnly") || "").toLowerCase() === "true"

    const rows = await prismaDb.authLog.findMany({
      where: {
        provider: "system",
        mode: "notification",
        status: "SUCCESS",
        email: actor.id,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        response: true,
        createdAt: true,
      },
    })

    const notifications = rows
      .map((row: any) => mapAuthLogToNotification(row))
      .filter((item) => (unreadOnly ? !item.read : true))

    return NextResponse.json({ ok: true, data: notifications })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch notifications"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request)
    if (error || !actor) return error

    const body = await request.json()
    const title = String(body?.title || "").trim()
    const message = String(body?.message || "").trim()
    const type = String(body?.type || "system").trim().toLowerCase()
    const actionHref = body?.actionHref ? String(body.actionHref) : undefined
    const recipientId = body?.recipientId ? String(body.recipientId) : actor.id

    if (!title || !message) {
      return NextResponse.json({ ok: false, error: "title and message are required" }, { status: 400 })
    }

    if (recipientId !== actor.id && !hasAnyRole(actor, ["admin", "sub-admin", "subadmin", "secretary"])) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
    }

    const row = await createInAppNotification({
      userId: recipientId,
      type,
      title,
      message,
      actionHref,
      metadata: { senderId: actor.id },
    })

    return NextResponse.json({
      ok: true,
      data: {
        id: row.id,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create notification"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request)
    if (error || !actor) return error

    const body = await request.json()
    const id = body?.id ? String(body.id) : ""
    const markAllRead = Boolean(body?.markAllRead)

    if (!id && !markAllRead) {
      return NextResponse.json({ ok: false, error: "id or markAllRead is required" }, { status: 400 })
    }

    const rows = await prismaDb.authLog.findMany({
      where: {
        provider: "system",
        mode: "notification",
        status: "SUCCESS",
        email: actor.id,
        ...(id ? { id } : {}),
      },
      select: { id: true, response: true },
    })

    for (const row of rows) {
      const payload = safeParse(row.response) || {}
      payload.read = true
      await prismaDb.authLog.update({
        where: { id: row.id },
        data: { response: JSON.stringify(payload) },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update notifications"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request)
    if (error || !actor) return error

    const { searchParams } = new URL(request.url)
    const id = String(searchParams.get("id") || "").trim()
    if (!id) {
      return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 })
    }

    const row = await prismaDb.authLog.findFirst({
      where: {
        id,
        provider: "system",
        mode: "notification",
        status: "SUCCESS",
      },
      select: { id: true, email: true },
    })

    if (!row || row.email !== actor.id) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 })
    }

    await prismaDb.authLog.delete({ where: { id: row.id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete notification"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
