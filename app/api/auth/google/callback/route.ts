import { NextResponse } from "next/server"
import { exchangeCodeForToken, fetchGoogleUserInfo } from "@/lib/server/google-oauth"
import { db, serializePayload } from "@/lib/server/db"
import { createSessionCookie } from "@/lib/server/session"

function normalizeMode(mode: string | null | undefined): "login" | "signup" {
  return mode === "signup" ? "signup" : "login"
}

function decodeState(state: string | null): { mode: string; role: string } {
  if (!state) {
    return { mode: "login", role: "customer" }
  }

  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf8"))
    const mode = normalizeMode(String(decoded?.mode || "login"))
    const role = normalizeSignupRole(String(decoded?.role || "customer"))
    return {
      mode,
      role,
    }
  } catch {
    return { mode: "login", role: "customer" }
  }
}

function normalizeSignupRole(role: string): string {
  const normalized = String(role || "customer").trim().toLowerCase()
  if (normalized === "provider") return "provider"
  if (normalized === "shopkeeper") return "shopkeeper"
  return "customer"
}

function routeByRole(role: string): string {
  const normalized = String(role || "customer").trim().toLowerCase().replace(/_/g, "-")
  if (normalized === "admin") return "/admin"
  if (normalized === "provider") return "/provider"
  if (normalized === "shopkeeper") return "/shopkeeper"
  if (normalized === "secretary") return "/secretary"
  if (normalized === "sub-admin" || normalized === "subadmin") return "/sub-admin"
  if (normalized === "agent") return "/agent"
  return "/customer/home"
}

async function createRoleProfile(tx: any, role: string, userId: string) {
  if (role === "customer") {
    await tx.customer.upsert({
      where: { userId },
      update: {},
      create: { userId },
    })
    return
  }

  if (role === "provider") {
    await tx.serviceProvider.upsert({
      where: { userId },
      update: {},
      create: { userId },
    })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get("code")
    const error = searchParams.get("error")
    const errorDescription = searchParams.get("error_description")
    const state = searchParams.get("state")
    const parsedState = decodeState(state)
    const oauthError = String(errorDescription || error || "").trim()

    if (oauthError) {
      await db.authLog.create({
        data: {
          provider: "google",
          mode: parsedState.mode,
          status: "FAILED",
          error: oauthError,
        },
      })
      return NextResponse.redirect(`${origin}/auth/${parsedState.mode}?error=${encodeURIComponent(oauthError)}`)
    }

    if (!code) {
      return NextResponse.redirect(`${origin}/auth/${parsedState.mode}?error=${encodeURIComponent("Missing authorization code")}`)
    }

    const token = await exchangeCodeForToken(code)
    const googleUser = await fetchGoogleUserInfo(token.access_token)
    const googleEmail = String(googleUser.email || "").trim().toLowerCase()

    if (!googleEmail) {
      return NextResponse.redirect(`${origin}/auth/${parsedState.mode}?error=${encodeURIComponent("Google account does not expose an email address")}`)
    }

    let appUser = await db.user.findFirst({
      where: {
        email: googleEmail,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isSuspended: true,
      },
    })

    if (parsedState.mode === "signup" && !appUser) {
      const role = normalizeSignupRole(parsedState.role)

      appUser = await db.$transaction(async (tx: any) => {
        const created = await tx.user.create({
          data: {
            name: googleUser.name,
            email: googleEmail,
            image: googleUser.picture || null,
            emailVerified: true,
            role,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isSuspended: true,
          },
        })

        await createRoleProfile(tx, role, created.id)
        return created
      })
    }

    if (!appUser) {
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent("No account found. Please sign up first.")}`)
    }

    if (appUser.isSuspended) {
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent("Account is suspended")}`)
    }

    await db.authLog.create({
      data: {
        provider: "google",
        mode: parsedState.mode,
        email: googleEmail,
        status: "SUCCESS",
        response: serializePayload({
          role: appUser.role,
          tokenType: token.token_type,
          expiresIn: token.expires_in,
        }),
      },
    })

    const response = NextResponse.redirect(new URL(`${origin}${routeByRole(appUser.role)}`))
    response.headers.append(
      "Set-Cookie",
      createSessionCookie({
        userId: appUser.id,
        role: appUser.role,
        email: appUser.email,
      }),
    )

    return response
  } catch (err) {
    const message = err instanceof Error ? err.message : "Google authentication failed"
    const { origin, searchParams } = new URL(request.url)
    const parsedState = decodeState(searchParams.get("state"))

    try {
      await db.authLog.create({
        data: {
          provider: "google",
          mode: parsedState.mode,
          status: "FAILED",
          error: message,
        },
      })
    } catch {
      // Keep API response behavior stable when DB logging fails.
    }

    return NextResponse.redirect(`${origin}/auth/${parsedState.mode}?error=${encodeURIComponent(message)}`)
  }
}
