interface GoogleTokenResponse {
  access_token: string
  expires_in: number
  scope: string
  token_type: string
  id_token?: string
  refresh_token?: string
}

interface GoogleUserInfo {
  id: string
  email: string
  verified_email: boolean
  name: string
  given_name?: string
  family_name?: string
  picture?: string
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing ${name} environment variable`)
  }
  return value
}

export function resolveGoogleRedirectUri(origin?: string): string {
  const explicit = process.env.GOOGLE_REDIRECT_URI
  if (explicit) return explicit

  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing GOOGLE_REDIRECT_URI environment variable in production")
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    return `${appUrl.replace(/\/$/, "")}/api/auth/google/callback`
  }

  if (origin) {
    return `${origin.replace(/\/$/, "")}/api/auth/google/callback`
  }

  throw new Error("Missing GOOGLE_REDIRECT_URI environment variable")
}

export function buildGoogleAuthUrl(state: string) {
  const clientId = getRequiredEnv("GOOGLE_CLIENT_ID")
  const redirectUri = resolveGoogleRedirectUri()

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state,
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function exchangeCodeForToken(code: string) {
  const clientId = getRequiredEnv("GOOGLE_CLIENT_ID")
  const clientSecret = getRequiredEnv("GOOGLE_CLIENT_SECRET")
  const redirectUri = resolveGoogleRedirectUri()

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  })

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  })

  const payload = (await response.json()) as GoogleTokenResponse & { error?: string; error_description?: string }

  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || "Failed to exchange Google auth code")
  }

  return payload
}

export async function fetchGoogleUserInfo(accessToken: string) {
  const response = await fetch("https://www.googleapis.com/oauth2/v1/userinfo?alt=json", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  })

  const payload = (await response.json()) as GoogleUserInfo & { error?: { message?: string } }

  if (!response.ok || !payload.email) {
    throw new Error(payload?.error?.message || "Failed to fetch Google user info")
  }

  return payload
}
