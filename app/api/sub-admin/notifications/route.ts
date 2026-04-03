import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth"
import { mapAuthLogToNotification } from "@/lib/server/in-app-notifications"

export async function GET(request: Request) {
  const { actor, error } = await getSessionActor(request)
  if (error) return error

  if (!actor || !hasAnyRole(actor, ["sub-admin", "subadmin", "admin"])) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
  }

  const rows = await db.authLog.findMany({
    where: {
      provider: "system",
      mode: "notification",
      status: "SUCCESS",
      email: actor.id,
    },
    orderBy: { createdAt: "desc" },
    take: 25,
    select: {
      id: true,
      response: true,
      createdAt: true,
    },
  })

  const notifications = rows.map((row: any) => {
    const item = mapAuthLogToNotification(row)
    return {
      id: item.id,
      text: item.title || item.message || "Notification",
      time: item.createdAt,
      type: item.type || "system",
    }
  })

  return NextResponse.json({ ok: true, notifications })
}
