import crypto from "node:crypto"
import type { User } from "@/lib/types"
import { NextResponse } from "next/server"

const SESSION_COOKIE = "saji_session"
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

interface SessionPayload {
  user: User
  exp: number
}

function getSessionSecret(): string {
  return process.env.AUTH_SESSION_SECRET || "dev-only-session-secret-change-me"
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url")
}

function sign(value: string): string {
  const secret = getSessionSecret()
  return b64url(crypto.createHmac("sha256", secret).update(value).digest())
}

export function createSessionToken(user: User): string {
  const payload: SessionPayload = {
    user,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  }

  const encoded = b64url(JSON.stringify(payload))
  const signature = sign(encoded)
  return `${encoded}.${signature}`
}

export function verifySessionToken(token: string): User | null {
  const [encoded, signature] = token.split(".")
  if (!encoded || !signature) {
    return null
  }

  const expectedSignature = sign(encoded)
  if (signature !== expectedSignature) {
    return null
  }

  try {
    const raw = Buffer.from(encoded, "base64url").toString("utf8")
    const payload = JSON.parse(raw) as SessionPayload

    if (!payload?.user || !payload?.exp) {
      return null
    }

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    return payload.user
  } catch {
    return null
  }
}

export function setSessionCookie(response: NextResponse, user: User) {
  const token = createSessionToken(user)
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  })
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE
}
