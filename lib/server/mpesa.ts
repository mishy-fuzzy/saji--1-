type MpesaEnv = "sandbox" | "production"

interface StkPushParams {
  phone: string
  amount: number
  accountReference: string
  transactionDesc: string
}

interface StkQueryParams {
  checkoutRequestId: string
}

interface MpesaConfig {
  env: MpesaEnv
  consumerKey: string
  consumerSecret: string
  shortCode: string
  passkey: string
  callbackUrl: string
}

export function getMpesaMissingConfigKeys(): string[] {
  return [
    !process.env.MPESA_CONSUMER_KEY ? "MPESA_CONSUMER_KEY" : null,
    !process.env.MPESA_CONSUMER_SECRET ? "MPESA_CONSUMER_SECRET" : null,
    !process.env.MPESA_SHORTCODE ? "MPESA_SHORTCODE" : null,
    !process.env.MPESA_PASSKEY ? "MPESA_PASSKEY" : null,
  ].filter(Boolean) as string[]
}

function normalizeBaseUrl(value: string | null | undefined): string {
  const raw = String(value || "").trim()
  if (!raw) return ""
  if (/^https?:\/\//i.test(raw)) return raw.replace(/\/+$/, "")
  return `https://${raw.replace(/\/+$/, "")}`
}

function resolveAppBaseUrl(): string {
  const explicit = normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL)
  if (explicit) return explicit

  const production = normalizeBaseUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL)
  if (production) return production

  const vercelUrl = normalizeBaseUrl(process.env.VERCEL_URL)
  if (vercelUrl) return vercelUrl

  return "http://localhost:3500"
}

function getMpesaConfig(): MpesaConfig {
  const env = (process.env.MPESA_ENV || "sandbox") as MpesaEnv
  const consumerKey = process.env.MPESA_CONSUMER_KEY || ""
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET || ""
  const shortCode = process.env.MPESA_SHORTCODE || ""
  const passkey = process.env.MPESA_PASSKEY || ""
  const callbackUrl =
    process.env.MPESA_CALLBACK_URL ||
    `${resolveAppBaseUrl()}/api/payments/mpesa/callback`

  const missingKeys = getMpesaMissingConfigKeys()

  if (missingKeys.length > 0) {
    throw new Error(`Missing M-Pesa environment configuration: ${missingKeys.join(", ")}`)
  }

  // Safaricom rejects localhost callback URLs for real STK flow callbacks.
  if (!/^https?:\/\//i.test(callbackUrl)) {
    throw new Error("MPESA_CALLBACK_URL must be a valid http(s) URL")
  }

  const callbackHost = new URL(callbackUrl).hostname.toLowerCase()
  const isLocalCallback = callbackHost === "localhost" || callbackHost === "127.0.0.1"
  if (isLocalCallback && env === "production") {
    throw new Error("MPESA_CALLBACK_URL must be a public URL in production")
  }

  return {
    env,
    consumerKey,
    consumerSecret,
    shortCode,
    passkey,
    callbackUrl,
  }
}

function getBaseUrl(env: MpesaEnv): string {
  return env === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke"
}

function formatPhoneTo254(phone: string): string {
  const digits = phone.replace(/\D/g, "")

  if (digits.startsWith("254") && digits.length === 12) {
    return digits
  }
  if (digits.startsWith("0") && digits.length === 10) {
    return `254${digits.slice(1)}`
  }
  if (digits.length === 9) {
    return `254${digits}`
  }

  throw new Error("Invalid phone number format for M-Pesa")
}

async function getAccessToken(config: MpesaConfig): Promise<string> {
  const baseUrl = getBaseUrl(config.env)
  const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString("base64")

  const response = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
    cache: "no-store",
  })

  const payload = await response.json()

  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.errorMessage || "Unable to get M-Pesa access token")
  }

  return payload.access_token as string
}

export async function initiateStkPush(params: StkPushParams) {
  const config = getMpesaConfig()
  const token = await getAccessToken(config)
  const baseUrl = getBaseUrl(config.env)

  const phone = formatPhoneTo254(params.phone)
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)
  const password = Buffer.from(`${config.shortCode}${config.passkey}${timestamp}`).toString("base64")
  const amount = Math.max(1, Math.round(params.amount))

  const response = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: config.shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: config.shortCode,
      PhoneNumber: phone,
      CallBackURL: config.callbackUrl,
      AccountReference: params.accountReference,
      TransactionDesc: params.transactionDesc,
    }),
    cache: "no-store",
  })

  const payload = await response.json()

  if (!response.ok || payload?.ResponseCode !== "0") {
    throw new Error(payload?.errorMessage || payload?.ResponseDescription || "M-Pesa STK push failed")
  }

  return payload
}

export async function queryStkPushStatus(params: StkQueryParams) {
  const checkoutRequestId = String(params.checkoutRequestId || "").trim()
  if (!checkoutRequestId) {
    throw new Error("checkoutRequestId is required")
  }

  const config = getMpesaConfig()
  const token = await getAccessToken(config)
  const baseUrl = getBaseUrl(config.env)

  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)
  const password = Buffer.from(`${config.shortCode}${config.passkey}${timestamp}`).toString("base64")

  const response = await fetch(`${baseUrl}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: config.shortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
    cache: "no-store",
  })

  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload?.errorMessage || payload?.ResponseDescription || "Failed to query STK status")
  }

  return payload
}
