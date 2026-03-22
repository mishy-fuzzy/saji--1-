import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { hashPassword } from "@/lib/server/password"

const prismaDb: any = db
const CODE_TTL_MS = 10 * 60 * 1000

function buildCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = String(body?.email || "").trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ ok: false, error: "email is required" }, { status: 400 })
    }

    const user = await prismaDb.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    })

    // Always return success shape to avoid account enumeration.
    if (!user) {
      return NextResponse.json({ ok: true })
    }

    const code = buildCode()
    const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString()

    await prismaDb.authLog.create({
      data: {
        provider: "local",
        mode: "password-reset-code",
        email,
        status: "PENDING",
        response: JSON.stringify({
          codeHash: hashPassword(code),
          expiresAt,
        }),
      },
    })

    return NextResponse.json({
      ok: true,
      ...(process.env.NODE_ENV !== "production" ? { devCode: code } : {}),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to request password reset"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
