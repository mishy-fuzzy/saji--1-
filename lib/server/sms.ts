interface SmsConfig {
  apiKey: string
  username: string
  senderId?: string
}

function getSmsConfig(): SmsConfig {
  const apiKey = process.env.AFRICASTALKING_API_KEY || ""
  const username = process.env.AFRICASTALKING_USERNAME || ""
  const senderId = process.env.AFRICASTALKING_SENDER_ID || undefined

  if (!apiKey || !username) {
    throw new Error("Missing SMS environment configuration")
  }

  return { apiKey, username, senderId }
}

function normalizeRecipients(to: string | string[]): string {
  if (Array.isArray(to)) {
    return to.join(",")
  }
  return to
}

export async function sendSms(to: string | string[], message: string) {
  const config = getSmsConfig()

  if (!message.trim()) {
    throw new Error("message is required")
  }

  const body = new URLSearchParams({
    username: config.username,
    to: normalizeRecipients(to),
    message,
  })

  if (config.senderId) {
    body.append("from", config.senderId)
  }

  const response = await fetch("https://api.africastalking.com/version1/messaging", {
    method: "POST",
    headers: {
      apiKey: config.apiKey,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  })

  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload?.SMSMessageData?.Message || "SMS send failed")
  }

  return payload
}
