import { NextResponse } from "next/server"
import { db, serializePayload } from "@/lib/server/db"
import { getSessionActor } from "@/lib/server/api-auth"
import { queryStkPushStatus } from "@/lib/server/mpesa"
import { createInAppNotification } from "@/lib/server/in-app-notifications"

const prismaDb: any = db

function walletReferencePrefix(userId: string): string {
  return `WALLET:${userId}:`
}

function toUiStatus(value: string | null | undefined): "pending" | "completed" | "failed" {
  const normalized = String(value || "PENDING").toUpperCase()
  if (normalized === "SUCCESS" || normalized === "COMPLETED") return "completed"
  if (normalized === "FAILED") return "failed"
  return "pending"
}

function resolveQueryResultStatus(queryPayload: any): "SUCCESS" | "FAILED" | "PENDING" {
  const rawCode = queryPayload?.ResultCode
  if (rawCode === undefined || rawCode === null || rawCode === "") {
    return "PENDING"
  }

  const resultCode = Number(rawCode)
  if (Number.isNaN(resultCode)) {
    return "PENDING"
  }

  return resultCode === 0 ? "SUCCESS" : "FAILED"
}

function getWalletUserIdFromReference(reference: string | null | undefined): string | null {
  const value = String(reference || "")
  if (!value.startsWith("WALLET:")) return null
  const segments = value.split(":")
  return segments[1] || null
}

async function ensureWalletCreditFromStk(sourceTx: any, checkoutRequestId: string): Promise<boolean> {
  const walletSourceReference = sourceTx?.reference ? String(sourceTx.reference) : null
  const walletUserId = getWalletUserIdFromReference(walletSourceReference)
  const walletTopUpAmount = Math.max(0, Math.round(Number(sourceTx?.amount || 0)))

  if (!walletUserId || !walletSourceReference || walletTopUpAmount <= 0) {
    return false
  }

  const credited = await prismaDb.$transaction(async (prisma: any) => {
    const creditReference = `${walletSourceReference}:CREDIT:${checkoutRequestId}`
    const existingCredit = await prisma.paymentTransaction.findFirst({
      where: {
        provider: "wallet",
        kind: "deposit",
        reference: creditReference,
      },
      select: { id: true },
    })

    if (existingCredit) {
      return false
    }

    const wallet = await prisma.wallet.upsert({
      where: { userId: walletUserId },
      update: {},
      create: {
        userId: walletUserId,
        currency: "KES",
        balance: 0,
      },
      select: { balance: true, currency: true },
    })

    const currentBalance = Number(wallet.balance || 0)
    const newBalance = currentBalance + walletTopUpAmount

    await prisma.wallet.update({
      where: { userId: walletUserId },
      data: { balance: newBalance },
    })

    await prisma.paymentTransaction.create({
      data: {
        provider: "wallet",
        kind: "deposit",
        reference: creditReference,
        amount: walletTopUpAmount,
        currency: wallet.currency || "KES",
        status: "SUCCESS",
        request: sourceTx?.request || null,
        response: serializePayload({
          sourceProvider: "mpesa",
          sourceTransactionId: sourceTx?.id || null,
          checkoutRequestId,
          balanceAfter: newBalance,
        }),
      },
    })

    return true
  })

  if (credited) {
    await createInAppNotification({
      userId: walletUserId,
      type: "payment",
      title: "Wallet funded",
      message: `KES ${walletTopUpAmount.toLocaleString()} has been added to your wallet.`,
      actionHref: "/customer/wallet",
      metadata: { provider: "mpesa", checkoutRequestId },
    })
  }

  return credited
}

export async function GET(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request)
    if (error || !actor) return error

    const { searchParams } = new URL(request.url)
    const checkoutRequestId = String(searchParams.get("checkoutRequestId") || "").trim()

    if (!checkoutRequestId) {
      return NextResponse.json({ ok: false, error: "checkoutRequestId is required" }, { status: 400 })
    }

    let sourceTx = await prismaDb.paymentTransaction.findFirst({
      where: {
        provider: "mpesa",
        kind: "stkpush",
        externalId: checkoutRequestId,
        reference: { startsWith: walletReferencePrefix(actor.id) },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        reference: true,
        status: true,
        amount: true,
        request: true,
        response: true,
        error: true,
        externalId: true,
      },
    })

    if (!sourceTx) {
      return NextResponse.json({ ok: false, error: "Transaction not found" }, { status: 404 })
    }

    let sourceStatus = toUiStatus(sourceTx.status)
    if (sourceStatus === "pending" && sourceTx.externalId) {
      try {
        const queryPayload = await queryStkPushStatus({ checkoutRequestId })
        const resultStatus = resolveQueryResultStatus(queryPayload)
        const nextError =
          resultStatus === "FAILED"
            ? String(queryPayload?.ResultDesc || "M-Pesa payment failed")
            : null

        if (resultStatus !== "PENDING") {
          sourceTx = await prismaDb.paymentTransaction.update({
            where: { id: sourceTx.id },
            data: {
              status: resultStatus,
              response: serializePayload(queryPayload),
              error: nextError,
            },
            select: {
              id: true,
              reference: true,
              status: true,
              amount: true,
              request: true,
              response: true,
              error: true,
              externalId: true,
            },
          })

          sourceStatus = toUiStatus(sourceTx.status)
        }
      } catch {
        // Keep pending state when provider query is temporarily unavailable.
      }
    }

    if (sourceStatus === "completed") {
      await ensureWalletCreditFromStk(sourceTx, checkoutRequestId)
    }

    const creditReference = `${String(sourceTx.reference || "")}:CREDIT:${checkoutRequestId}`
    const creditTx = await prismaDb.paymentTransaction.findFirst({
      where: {
        provider: "wallet",
        kind: "deposit",
        reference: creditReference,
      },
      orderBy: { createdAt: "desc" },
      select: {
        status: true,
      },
    })

    const credited = Boolean(creditTx && toUiStatus(creditTx.status) === "completed")
    const status = sourceStatus === "completed" && credited ? "completed" : sourceStatus

    return NextResponse.json({
      ok: true,
      data: {
        checkoutRequestId,
        status,
        credited,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch STK status"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
