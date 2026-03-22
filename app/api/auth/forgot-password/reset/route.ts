import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { hashPassword, verifyPassword } from "@/lib/server/password"

const prismaDb: any = db

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
    const token = String(body?.resetToken || "").trim()
    const newPassword = String(body?.newPassword || "")

    if (!email || !token || !newPassword) {
      return NextResponse.json(
        { ok: false, error: "email, reset token and new password are required" },
        { status: 400 },
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ ok: false, error: "password must be at least 8 characters" }, { status: 400 })
    }

    const tokenLog = await prismaDb.authLog.findFirst({
      where: {
        provider: "local",
        mode: "password-reset-token",
        email,
        status: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    if (!tokenLog) {
      return NextResponse.json({ ok: false, error: "Invalid or expired reset token" }, { status: 400 })
    }

    const payload = parseResponse(tokenLog.response)
    const tokenHash = String(payload?.tokenHash || "")
    const expiresAt = String(payload?.expiresAt || "")

    if (!tokenHash || !expiresAt || Number.isNaN(Date.parse(expiresAt))) {
      return NextResponse.json({ ok: false, error: "Invalid or expired reset token" }, { status: 400 })
    }

    if (Date.now() > Date.parse(expiresAt) || !verifyPassword(token, tokenHash)) {
      return NextResponse.json({ ok: false, error: "Invalid or expired reset token" }, { status: 400 })
    }

    await prismaDb.user.update({
      where: { email },
      data: {
        passwordHash: hashPassword(newPassword),
      },
    })

    await prismaDb.authLog.update({
      where: { id: tokenLog.id },
      data: { status: "SUCCESS" },
    })

    await prismaDb.authLog.create({
      data: {
        provider: "local",
        mode: "password-reset-complete",
        email,
        status: "SUCCESS",
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reset password"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
