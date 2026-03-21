interface PayPalConfig {
  clientId: string
  clientSecret: string
  baseUrl: string
}

function getPayPalConfig(): PayPalConfig {
  const clientId = process.env.PAYPAL_CLIENT_ID || ""
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || ""
  const mode = process.env.PAYPAL_MODE || "sandbox"

  if (!clientId || !clientSecret) {
    throw new Error("Missing PayPal environment configuration")
  }

  return {
    clientId,
    clientSecret,
    baseUrl: mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com",
  }
}

async function getAccessToken(config: PayPalConfig): Promise<string> {
  const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")

  const response = await fetch(`${config.baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  })

  const payload = await response.json()
  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.error_description || "Failed to obtain PayPal token")
  }

  return payload.access_token as string
}

export async function createPayPalOrder(params: {
  amount: number
  currency?: string
  reference?: string
}) {
  const config = getPayPalConfig()
  const token = await getAccessToken(config)
  const currency = (params.currency || "USD").toUpperCase()

  const response = await fetch(`${config.baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: params.reference || `SAJI-${Date.now()}`,
          amount: {
            currency_code: currency,
            value: (Math.max(1, params.amount)).toFixed(2),
          },
        },
      ],
      application_context: {
        user_action: "PAY_NOW",
      },
    }),
    cache: "no-store",
  })

  const payload = await response.json()
  if (!response.ok || !payload?.id) {
    throw new Error(payload?.message || "Failed to create PayPal order")
  }

  return payload
}

export async function capturePayPalOrder(orderId: string) {
  const config = getPayPalConfig()
  const token = await getAccessToken(config)

  const response = await fetch(`${config.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })

  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload?.message || "Failed to capture PayPal order")
  }

  return payload
}
