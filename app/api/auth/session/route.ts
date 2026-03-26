import { NextRequest, NextResponse } from "next/server"
import { getSessionCookieName, verifySessionToken } from "@/lib/server/session"

export async function GET(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value
  if (!token) {
    return NextResponse.json({ ok: true, user: null })
  }

  const user = verifySessionToken(token)
  if (!user) {
    return NextResponse.json({ ok: true, user: null })
  }

  return NextResponse.json({ ok: true, user })
}
