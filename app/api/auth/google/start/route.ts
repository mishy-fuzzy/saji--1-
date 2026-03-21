import { NextResponse } from "next/server"
import { buildGoogleAuthUrl } from "@/lib/server/google-oauth"
import { db, serializePayload } from "@/lib/server/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get("mode") || "login"
    const role = searchParams.get("role") || "customer"
    const state = Buffer.from(JSON.stringify({ mode, role, ts: Date.now() })).toString("base64url")

    const authUrl = buildGoogleAuthUrl(state)

    await db.authLog.create({
      data: {
        provider: "google",
        mode,
        status: "STARTED",
        response: serializePayload({ role, state }),
      },
    })

    return NextResponse.redirect(authUrl)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google OAuth start failed"

    try {
      await db.authLog.create({
        data: {
          provider: "google",
          mode: "login",
          status: "FAILED",
          error: message,
        },
      })
    } catch {
      // Keep API response behavior stable when DB logging fails.
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
