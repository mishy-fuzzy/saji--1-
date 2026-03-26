import { NextResponse } from "next/server"
import { exchangeCodeForToken, fetchGoogleUserInfo } from "@/lib/server/google-oauth"
import { db, serializePayload } from "@/lib/server/db"
import { setSessionCookie } from "@/lib/server/session"
import type { User } from "@/lib/types"

function decodeState(state: string | null): { mode: string; role: string } {
  if (!state) {
    return { mode: "login", role: "customer" }
  }

  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf8"))
    return {
      mode: String(decoded?.mode || "login"),
      role: String(decoded?.role || "customer"),
    }
  } catch {
    return { mode: "login", role: "customer" }
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get("code")
    const error = searchParams.get("error")
    const state = searchParams.get("state")
    const parsedState = decodeState(state)

    if (error) {
      await db.authLog.create({
        data: {
          provider: "google",
          mode: parsedState.mode,
          status: "FAILED",
          error,
        },
      })
      return NextResponse.redirect(`${origin}/auth/${parsedState.mode}?error=${encodeURIComponent(error)}`)
    }

    if (!code) {
      return NextResponse.redirect(`${origin}/auth/${parsedState.mode}?error=${encodeURIComponent("Missing authorization code")}`)
    }

    const token = await exchangeCodeForToken(code)
    const user = await fetchGoogleUserInfo(token.access_token)

    await db.authLog.create({
      data: {
        provider: "google",
        mode: parsedState.mode,
        email: user.email,
        status: "SUCCESS",
        response: serializePayload({
          role: parsedState.role,
          tokenType: token.token_type,
          expiresIn: token.expires_in,
        }),
      },
    })

    const targetPath = parsedState.mode === "signup" ? "/auth/signup" : "/auth/login"
    const redirectUrl = new URL(`${origin}${targetPath}`)
    redirectUrl.searchParams.set("google", "1")
    redirectUrl.searchParams.set("email", user.email)
    redirectUrl.searchParams.set("name", user.name)
    redirectUrl.searchParams.set("role", parsedState.role)

    const response = NextResponse.redirect(redirectUrl)

    const sessionUser: User = {
      id: `google_${user.id}`,
      name: user.name,
      email: user.email,
      phone: "+254700000000",
      role: parsedState.role === "provider" ? "provider" : "customer",
      createdAt: new Date().toISOString(),
      avatar: user.picture,
    }

    setSessionCookie(response, sessionUser)
    return response
  } catch (err) {
    const message = err instanceof Error ? err.message : "Google authentication failed"
    const { origin } = new URL(request.url)

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

    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(message)}`)
  }
}
