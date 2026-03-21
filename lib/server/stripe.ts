function requireStripeKey(): string {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable")
  }
  return key
}

export async function createCardPaymentIntent(params: {
  amount: number
  currency?: string
  receiptEmail?: string
  description?: string
  metadata?: Record<string, string>
}) {
  const stripeKey = requireStripeKey()
  const currency = (params.currency || "kes").toLowerCase()
  const amount = Math.max(1, Math.round(params.amount))

  const body = new URLSearchParams({
    amount: String(amount),
    currency,
    "automatic_payment_methods[enabled]": "true",
  })

  if (params.receiptEmail) {
    body.append("receipt_email", params.receiptEmail)
  }
  if (params.description) {
    body.append("description", params.description)
  }

  if (params.metadata) {
    for (const [key, value] of Object.entries(params.metadata)) {
      body.append(`metadata[${key}]`, value)
    }
  }

  const response = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  })

  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Failed to create card payment intent")
  }

  return payload
}
