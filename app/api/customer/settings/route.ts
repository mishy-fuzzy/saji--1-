import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth"
import { hashPassword, verifyPassword } from "@/lib/server/password"

type CustomerSettingsPayload = {
  location: string
  language: string
  currency: string
  theme: "light" | "dark"
  notifications: {
    jobUpdates: boolean
    messages: boolean
    payments: boolean
    promotions: boolean
    emailDigest: boolean
    pushNotifications: boolean
  }
}

const DEFAULT_SETTINGS: CustomerSettingsPayload = {
  location: "",
  language: "en",
  currency: "KES",
  theme: "light",
  notifications: {
    jobUpdates: true,
    messages: true,
    payments: true,
    promotions: false,
    emailDigest: true,
    pushNotifications: true,
  },
}

function parseSettings(raw: string | null | undefined): CustomerSettingsPayload {
  if (!raw) return DEFAULT_SETTINGS
  try {
    const parsed = JSON.parse(raw) as Partial<CustomerSettingsPayload>
    return {
      location: String(parsed.location || ""),
      language: String(parsed.language || DEFAULT_SETTINGS.language),
      currency: String(parsed.currency || DEFAULT_SETTINGS.currency),
      theme: parsed.theme === "dark" ? "dark" : "light",
      notifications: {
        ...DEFAULT_SETTINGS.notifications,
        ...(parsed.notifications || {}),
      },
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function maskPhone(phone: string): string {
  const trimmed = String(phone || "").trim()
  if (!trimmed) return ""
  if (trimmed.length <= 4) return trimmed
  return `${trimmed.slice(0, 4)}****${trimmed.slice(-2)}`
}

export async function GET(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request)
    if (error) return error
    if (!actor || !hasAnyRole(actor, ["customer"])) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
    }

    const user = await db.user.findUnique({
      where: { id: actor.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 })
    }

    const settingsLog = await db.authLog.findFirst({
      where: {
        provider: "local",
        mode: "customer-settings",
        email: user.email,
        status: "SUCCESS",
      },
      orderBy: { createdAt: "desc" },
      select: { response: true },
    })

    const settings = parseSettings(settingsLog?.response)

    const payments = await db.paymentTransaction.findMany({
      where: {
        OR: [
          {
            booking: {
              customerId: actor.id,
            },
          },
          {
            reference: { startsWith: `WALLET:${actor.id}:` },
          },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        provider: true,
        amount: true,
        currency: true,
        status: true,
        createdAt: true,
      },
    })

    const billingHistory = payments.map((row: any) => ({
      id: row.id,
      desc: `Payment via ${String(row.provider || "payment").toUpperCase()}`,
      amount: `${String(row.currency || "KES")} ${Number(row.amount || 0).toLocaleString()}`,
      date: new Date(row.createdAt).toLocaleDateString(),
      status: String(row.status || "PENDING").toUpperCase(),
      provider: String(row.provider || "wallet").toLowerCase(),
    }))

    const paymentMethods = Array.from(new Set(billingHistory.map((entry) => entry.provider))).map((provider) => {
      if (provider === "mpesa") {
        return {
          provider: "M-PESA",
          label: "M-Pesa",
          detail: maskPhone(String(user.phone || "")) || "Phone not set",
        }
      }

      return {
        provider: provider.toUpperCase(),
        label: provider.toUpperCase(),
        detail: "Configured from transaction history",
      }
    })

    const exportMode = new URL(request.url).searchParams.get("export")
    if (exportMode === "1") {
      return NextResponse.json({
        ok: true,
        data: {
          profile: {
            id: user.id,
            name: user.name || "",
            email: user.email,
            phone: user.phone || "",
            role: user.role,
            createdAt: user.createdAt,
          },
          settings,
          billingHistory,
          exportedAt: new Date().toISOString(),
        },
      })
    }

    return NextResponse.json({
      ok: true,
      data: {
        profile: {
          name: user.name || "",
          email: user.email,
          phone: user.phone || "",
          avatar: user.image || "",
        },
        settings,
        paymentMethods,
        billingHistory,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load settings"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request)
    if (error) return error
    if (!actor || !hasAnyRole(actor, ["customer"])) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const action = String(body?.action || "").trim().toLowerCase()

    const user = await db.user.findUnique({
      where: { id: actor.id },
      select: { id: true, email: true, passwordHash: true },
    })
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 })
    }

    if (action === "profile") {
      const name = String(body?.profile?.name || "").trim()
      const phone = String(body?.profile?.phone || "").trim()

      await db.user.update({
        where: { id: user.id },
        data: {
          ...(name ? { name } : {}),
          phone,
        },
      })

      return NextResponse.json({ ok: true })
    }

    if (action === "password") {
      const currentPassword = String(body?.currentPassword || "")
      const newPassword = String(body?.newPassword || "")

      if (!user.passwordHash || !verifyPassword(currentPassword, user.passwordHash)) {
        return NextResponse.json({ ok: false, error: "Current password is incorrect" }, { status: 400 })
      }

      if (newPassword.length < 8) {
        return NextResponse.json({ ok: false, error: "New password must be at least 8 characters" }, { status: 400 })
      }

      await db.user.update({
        where: { id: user.id },
        data: { passwordHash: hashPassword(newPassword) },
      })

      return NextResponse.json({ ok: true })
    }

    if (action === "preferences" || action === "notifications") {
      const latest = await db.authLog.findFirst({
        where: {
          provider: "local",
          mode: "customer-settings",
          email: user.email,
          status: "SUCCESS",
        },
        orderBy: { createdAt: "desc" },
        select: { response: true },
      })

      const current = parseSettings(latest?.response)
      const nextSettings: CustomerSettingsPayload = {
        ...current,
        ...(action === "preferences" ? {
          location: String(body?.preferences?.location || current.location),
          language: String(body?.preferences?.language || current.language),
          currency: String(body?.preferences?.currency || current.currency),
          theme: body?.preferences?.theme === "dark" ? "dark" : "light",
        } : {}),
        ...(action === "notifications"
          ? {
              notifications: {
                ...current.notifications,
                ...(body?.notifications || {}),
              },
            }
          : {}),
      }

      await db.authLog.create({
        data: {
          provider: "local",
          mode: "customer-settings",
          email: user.email,
          status: "SUCCESS",
          response: JSON.stringify(nextSettings),
        },
      })

      return NextResponse.json({ ok: true, data: nextSettings })
    }

    return NextResponse.json({ ok: false, error: "Unsupported settings action" }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update settings"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request)
    if (error) return error
    if (!actor || !hasAnyRole(actor, ["customer"])) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const reason = String(body?.reason || "").trim() || "No reason provided"

    const user = await db.user.findUnique({
      where: { id: actor.id },
      select: { id: true, email: true },
    })
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 })
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        deletedAt: new Date(),
        isSuspended: true,
      },
    })

    await db.authLog.create({
      data: {
        provider: "local",
        mode: "customer-delete-account",
        email: user.email,
        status: "SUCCESS",
        response: JSON.stringify({ reason }),
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete account"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
