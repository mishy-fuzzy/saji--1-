import { randomBytes } from "crypto"
import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { hashPassword, verifyPassword } from "@/lib/server/password"

const prismaDb: any = db
const TOKEN_TTL_MS = 15 * 60 * 1000

function parseResponse(value: string | null) {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = String(body?.email || "").trim().toLowerCase()
    const code = String(body?.code || "").trim()

    if (!email || !code) {
      return NextResponse.json({ ok: false, error: "email and code are required" }, { status: 400 })
    }

    const resetCodeLog = await prismaDb.authLog.findFirst({
      where: {
        provider: "local",
        mode: "password-reset-code",
        email,
        status: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    if (!resetCodeLog) {
      return NextResponse.json({ ok: false, error: "Invalid or expired verification code" }, { status: 400 })
    }

    const payload = parseResponse(resetCodeLog.response)
    const codeHash = String(payload?.codeHash || "")
    const expiresAt = String(payload?.expiresAt || "")

    if (!codeHash || !expiresAt || Number.isNaN(Date.parse(expiresAt))) {
      return NextResponse.json({ ok: false, error: "Invalid or expired verification code" }, { status: 400 })
    }

    if (Date.now() > Date.parse(expiresAt) || !verifyPassword(code, codeHash)) {
      return NextResponse.json({ ok: false, error: "Invalid or expired verification code" }, { status: 400 })
    }

    const token = randomBytes(24).toString("hex")
    const tokenExpiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString()

    await prismaDb.authLog.update({
      where: { id: resetCodeLog.id },
      data: { status: "SUCCESS" },
    })

    await prismaDb.authLog.create({
      data: {
        provider: "local",
        mode: "password-reset-token",
        email,
        status: "PENDING",
        response: JSON.stringify({
          tokenHash: hashPassword(token),
          expiresAt: tokenExpiresAt,
        }),
      },
    })

    return NextResponse.json({ ok: true, resetToken: token })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to verify reset code"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
