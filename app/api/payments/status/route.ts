import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const provider = String(searchParams.get("provider") || "").trim()
    const externalId = String(searchParams.get("externalId") || "").trim()
    const reference = String(searchParams.get("reference") || "").trim()

    if (!provider) {
      return NextResponse.json({ error: "provider is required" }, { status: 400 })
    }

    if (!externalId && !reference) {
      return NextResponse.json({ error: "externalId or reference is required" }, { status: 400 })
    }

    const tx = await db.paymentTransaction.findFirst({
      where: {
        provider,
        ...(externalId ? { externalId } : {}),
        ...(reference ? { reference } : {}),
      },
      orderBy: { createdAt: "desc" },
    })

    if (!tx) {
      return NextResponse.json({ ok: true, data: null })
    }

    return NextResponse.json({
      ok: true,
      data: {
        id: tx.id,
        provider: tx.provider,
        kind: tx.kind,
        reference: tx.reference,
        externalId: tx.externalId,
        amount: tx.amount,
        currency: tx.currency,
        status: tx.status,
        error: tx.error,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch payment status"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
