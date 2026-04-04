import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { getSessionCookieName, verifySessionToken } from "@/lib/server/session"

export async function GET(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value
  const sessionUser = token ? verifySessionToken(token) : null

  if (!sessionUser) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { email: sessionUser.email },
  })

  if (!user) {
    return NextResponse.json({ ok: true, user: sessionUser })
  }

  const phoneVerification = await db.authLog.findFirst({
    where: {
      provider: "local",
      mode: "verified-phone",
      email: user.email,
      status: "SUCCESS",
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  })

  return NextResponse.json({
    ok: true,
    user: {
      ...user,
      phoneVerified: Boolean(phoneVerification),
    },
  })
}
