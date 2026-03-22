import { createHmac } from "crypto"

const COOKIE_NAME = "saji_session"
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7

type SessionPayload = {
  userId: string
  role: string
  email: string
  exp: number
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url")
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8")
}

function getSessionSecret(): string {
  return process.env.AUTH_SECRET || "dev-only-insecure-session-secret"
}

function sign(value: string): string {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url")
}

function parseCookieHeader(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {}

  const pairs = cookieHeader.split(";")
  const parsed: Record<string, string> = {}

  for (const pair of pairs) {
    const [k, ...rest] = pair.trim().split("=")
    if (!k || rest.length === 0) continue
    parsed[k] = rest.join("=")
  }

  return parsed
}

export function createSessionCookie(payload: { userId: string; role: string; email: string }): string {
  const sessionPayload: SessionPayload = {
    userId: payload.userId,
    role: payload.role,
    email: payload.email,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
  }

  const encoded = base64UrlEncode(JSON.stringify(sessionPayload))
  const signature = sign(encoded)
  const token = `${encoded}.${signature}`

  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SECONDS}`
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}

export function getSessionFromRequest(request: Request): SessionPayload | null {
  const cookieHeader = request.headers.get("cookie")
  const cookies = parseCookieHeader(cookieHeader)
  const token = cookies[COOKIE_NAME]

  if (!token) return null

  const [encoded, signature] = token.split(".")
  if (!encoded || !signature) return null

  const expected = sign(encoded)
  if (signature !== expected) return null

  try {
    const payload = JSON.parse(base64UrlDecode(encoded)) as SessionPayload
    if (!payload?.userId || !payload?.role || !payload?.email || !payload?.exp) {
      return null
    }

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    return payload
  } catch {
    return null
  }
}
