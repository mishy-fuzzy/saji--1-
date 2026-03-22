import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { getSessionActor } from "@/lib/server/api-auth"
import { createInAppNotification } from "@/lib/server/in-app-notifications"

const prismaDb: any = db

function walletReferencePrefix(userId: string): string {
  return `WALLET:${userId}:`
}

function amountToInt(value: unknown): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return 0
  return Math.round(parsed)
}

function formatRelativeDate(value: Date): string {
  const diffMs = Date.now() - value.getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`
  return value.toLocaleDateString()
}

export async function GET(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request)
    if (error || !actor) return error

    const wallet = await prismaDb.wallet.upsert({
      where: { userId: actor.id },
      update: {},
      create: {
        userId: actor.id,
        currency: "KES",
        balance: 0,
      },
      select: { id: true, balance: true, currency: true, updatedAt: true },
    })

    const [walletTransactions, bookingTransactions] = await Promise.all([
      prismaDb.paymentTransaction.findMany({
        where: {
          provider: "wallet",
          reference: { startsWith: walletReferencePrefix(actor.id) },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          kind: true,
          amount: true,
          status: true,
          createdAt: true,
          reference: true,
          response: true,
        },
      }),
      prismaDb.paymentTransaction.findMany({
        where: {
          booking: {
            customerId: actor.id,
          },
          status: { in: ["SUCCESS", "PENDING", "COMPLETED"] },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          provider: true,
          amount: true,
          status: true,
          createdAt: true,
          bookingId: true,
        },
      }),
    ])

    const walletRows = walletTransactions.map((tx: any) => {
      const action = tx.kind === "withdraw" ? "withdrawal" : "deposit"
      const signedAmount = tx.kind === "withdraw" ? -Math.abs(Number(tx.amount || 0)) : Math.abs(Number(tx.amount || 0))
      return {
        id: tx.id,
        type: action,
        description: tx.kind === "withdraw" ? "Withdrawal" : "Wallet deposit",
        amount: signedAmount,
        date: formatRelativeDate(new Date(tx.createdAt)),
        status: String(tx.status || "PENDING").toLowerCase() === "success" ? "completed" : "pending",
        createdAt: tx.createdAt,
      }
    })

    const bookingRows = bookingTransactions.map((tx: any) => ({
      id: tx.id,
      type: "payment",
      description: `Service payment via ${String(tx.provider || "payment").toUpperCase()}`,
      amount: -Math.abs(Number(tx.amount || 0)),
      date: formatRelativeDate(new Date(tx.createdAt)),
      status:
        String(tx.status || "PENDING").toUpperCase() === "SUCCESS" ||
        String(tx.status || "PENDING").toUpperCase() === "COMPLETED"
          ? "completed"
          : "pending",
      createdAt: tx.createdAt,
    }))

    const transactions = [...walletRows, ...bookingRows]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 100)

    const totalSpent = transactions
      .filter((tx) => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

    return NextResponse.json({
      ok: true,
      data: {
        balance: Number(wallet.balance || 0),
        currency: wallet.currency || "KES",
        totalSpent,
        transactions,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch wallet"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request)
    if (error || !actor) return error

    const body = await request.json()
    const action = String(body?.action || "").trim().toLowerCase()
    const amount = amountToInt(body?.amount)
    const method = String(body?.method || "wallet").trim().toLowerCase()

    if (!amount) {
      return NextResponse.json({ ok: false, error: "amount must be greater than 0" }, { status: 400 })
    }

    if (!["deposit", "withdraw"].includes(action)) {
      return NextResponse.json({ ok: false, error: "action must be deposit or withdraw" }, { status: 400 })
    }

    const result = await prismaDb.$transaction(async (tx: any) => {
      const wallet = await tx.wallet.upsert({
        where: { userId: actor.id },
        update: {},
        create: { userId: actor.id, balance: 0, currency: "KES" },
      })

      const currentBalance = Number(wallet.balance || 0)
      if (action === "withdraw" && currentBalance < amount) {
        throw new Error("Insufficient wallet balance")
      }

      const newBalance = action === "deposit" ? currentBalance + amount : currentBalance - amount

      const updatedWallet = await tx.wallet.update({
        where: { userId: actor.id },
        data: { balance: newBalance },
        select: { balance: true, currency: true },
      })

      const transaction = await tx.paymentTransaction.create({
        data: {
          provider: "wallet",
          kind: action,
          reference: `${walletReferencePrefix(actor.id)}${Date.now()}`,
          amount,
          currency: updatedWallet.currency || "KES",
          status: "SUCCESS",
          request: JSON.stringify({ action, amount, method }),
          response: JSON.stringify({ balanceAfter: newBalance }),
        },
        select: { id: true, createdAt: true },
      })

      return {
        balance: Number(updatedWallet.balance || 0),
        currency: updatedWallet.currency || "KES",
        transaction,
      }
    })

    await createInAppNotification({
      userId: actor.id,
      type: "payment",
      title: action === "deposit" ? "Wallet funded" : "Withdrawal completed",
      message:
        action === "deposit"
          ? `KES ${amount.toLocaleString()} was added to your wallet.`
          : `KES ${amount.toLocaleString()} was withdrawn from your wallet.`,
      actionHref: "/customer/wallet",
      metadata: { action, amount, method },
    })

    return NextResponse.json({ ok: true, data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update wallet"
    const status = message.toLowerCase().includes("insufficient") ? 400 : 500
    return NextResponse.json({ ok: false, error: message }, { status })
  }
}
