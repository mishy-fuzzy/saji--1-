function sanitizeUrl(value: string): string {
  return value.replace(/\/$/, "")
}

function firstHeaderValue(value: string | null): string {
  return String(value || "")
    .split(",")[0]
    .trim()
}

export function resolveAppUrlFromRequest(request: Request): string {
  const forwardedHost = firstHeaderValue(request.headers.get("x-forwarded-host"))
  const forwardedProto = firstHeaderValue(request.headers.get("x-forwarded-proto"))

  if (forwardedHost) {
    const protocol = forwardedProto || "https"
    return sanitizeUrl(`${protocol}://${forwardedHost}`)
  }

  const host = firstHeaderValue(request.headers.get("host"))
  if (host) {
    const protocol = forwardedProto || (request.url.startsWith("https://") ? "https" : "http")
    return sanitizeUrl(`${protocol}://${host}`)
  }

  const explicit = String(process.env.NEXT_PUBLIC_APP_URL || "").trim()
  if (explicit) {
    return sanitizeUrl(explicit)
  }

  const vercelUrl = String(process.env.VERCEL_URL || "").trim()
  if (vercelUrl) {
    return sanitizeUrl(`https://${vercelUrl}`)
  }

  return "http://localhost:3500"
}
