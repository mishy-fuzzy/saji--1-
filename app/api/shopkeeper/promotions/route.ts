import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth"
import { randomUUID } from "crypto"

const prismaDb: any = db

type PromotionType = "percentage" | "fixed"
type PromotionStatus = "active" | "scheduled" | "expired" | "paused"

type PromotionPayload = {
  id: string
  name: string
  code: string
  type: PromotionType
  value: number
  minOrder: number
  maxUses: number
  usedCount: number
  startDate: string
  endDate: string
  status: PromotionStatus
  products: string
  description: string
}

type PromotionDbRow = {
  id: string
  name: string
  code: string
  type: string
  value: number
  minOrder: number
  maxUses: number
  usedCount: number
  startDate: Date | string
  endDate: Date | string
  status: string
  products: string
  description: string
}

function toDateOnly(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(String(value || ""))
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().slice(0, 10)
}

function normalizeStatus(value: string): PromotionStatus {
  const normalized = String(value || "").toLowerCase()
  if (normalized === "paused") return "paused"
  if (normalized === "scheduled") return "scheduled"
  if (normalized === "expired") return "expired"
  return "active"
}

function computeStatus(startDate: string, endDate: string, requestedStatus: string): PromotionStatus {
  const manual = normalizeStatus(requestedStatus)
  if (manual === "paused") return "paused"

  const now = new Date()
  const start = startDate ? new Date(startDate) : null
  const end = endDate ? new Date(endDate) : null

  if (start && !Number.isNaN(start.getTime()) && now < start) return "scheduled"
  if (end && !Number.isNaN(end.getTime()) && now > end) return "expired"
  return "active"
}

function toPromotionPayload(row: PromotionDbRow): PromotionPayload {
  const startDate = toDateOnly(row.startDate)
  const endDate = toDateOnly(row.endDate)
  const status = computeStatus(startDate, endDate, String(row.status || "active"))

  return {
    id: String(row.id || ""),
    name: String(row.name || "").trim(),
    code: String(row.code || "").trim().toUpperCase(),
    type: String(row.type || "percentage") === "fixed" ? "fixed" : "percentage",
    value: Number(row.value || 0),
    minOrder: Number(row.minOrder || 0),
    maxUses: Number(row.maxUses || 0),
    usedCount: Number(row.usedCount || 0),
    startDate,
    endDate,
    status,
    products: String(row.products || "").trim(),
    description: String(row.description || "").trim(),
  }
}

async function ensurePromotionTable() {
  await prismaDb.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ShopkeeperPromotion" (
      "id" TEXT PRIMARY KEY,
      "ownerUserId" TEXT NOT NULL,
      "ownerEmail" TEXT,
      "name" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "value" DOUBLE PRECISION NOT NULL,
      "minOrder" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "maxUses" INTEGER NOT NULL DEFAULT 0,
      "usedCount" INTEGER NOT NULL DEFAULT 0,
      "startDate" DATE NOT NULL,
      "endDate" DATE NOT NULL,
      "status" TEXT NOT NULL,
      "products" TEXT NOT NULL DEFAULT '',
      "description" TEXT NOT NULL DEFAULT '',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "deletedAt" TIMESTAMPTZ
    )
  `)

  await prismaDb.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "ShopkeeperPromotion_ownerUserId_idx" ON "ShopkeeperPromotion" ("ownerUserId")',
  )
  await prismaDb.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "ShopkeeperPromotion_status_idx" ON "ShopkeeperPromotion" ("status")',
  )
  await prismaDb.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "ShopkeeperPromotion_owner_code_active_uniq" ON "ShopkeeperPromotion" ("ownerUserId", "code") WHERE "deletedAt" IS NULL',
  )
}

export async function GET(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request)
    if (error || !actor) return error

    if (!hasAnyRole(actor, ["shopkeeper", "admin", "sub-admin", "subadmin"])) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
    }

    await ensurePromotionTable()

    const rows = await prismaDb.$queryRawUnsafe(
      `SELECT "id", "name", "code", "type", "value", "minOrder", "maxUses", "usedCount", "startDate", "endDate", "status", "products", "description"
       FROM "ShopkeeperPromotion"
       WHERE "ownerUserId" = $1 AND "deletedAt" IS NULL
       ORDER BY "createdAt" DESC
       LIMIT 200`,
      actor.id,
    ) as PromotionDbRow[]

    const promotions = rows.map((row) => toPromotionPayload(row))

    return NextResponse.json({
      ok: true,
      data: promotions,
    })
  } catch (error) {
    console.error("Shopkeeper promotions error:", error)
    return NextResponse.json(
      { ok: false, error: "Failed to fetch promotions" },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request)
    if (error || !actor) return error

    if (!hasAnyRole(actor, ["shopkeeper", "admin", "sub-admin", "subadmin"])) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const name = String(body?.name || "").trim()
    const code = String(body?.code || "").trim().toUpperCase()
    const type: PromotionType = String(body?.type || "percentage") === "fixed" ? "fixed" : "percentage"
    const value = Number(body?.value || 0)
    const minOrder = Number(body?.minOrder || 0)
    const maxUses = Number(body?.maxUses || 0)
    const usedCount = Number(body?.usedCount || 0)
    const startDate = String(body?.startDate || "").trim()
    const endDate = String(body?.endDate || "").trim()
    const products = String(body?.products || "").trim()
    const description = String(body?.description || "").trim()

    const status = computeStatus(startDate, endDate, String(body?.status || "active"))

    if (!name || !code || value <= 0) {
      return NextResponse.json(
        { ok: false, error: "name, code and value are required" },
        { status: 400 },
      )
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { ok: false, error: "startDate and endDate are required" },
        { status: 400 },
      )
    }

    await ensurePromotionTable()

    const duplicate = await prismaDb.$queryRawUnsafe(
      `SELECT "id" FROM "ShopkeeperPromotion"
       WHERE "ownerUserId" = $1 AND UPPER("code") = UPPER($2) AND "deletedAt" IS NULL
       LIMIT 1`,
      actor.id,
      code,
    ) as Array<{ id: string }>

    if (duplicate.length > 0) {
      return NextResponse.json(
        { ok: false, error: "Promotion code already exists" },
        { status: 409 },
      )
    }

    const id = randomUUID()

    await prismaDb.$executeRawUnsafe(
      `INSERT INTO "ShopkeeperPromotion" (
        "id", "ownerUserId", "ownerEmail", "name", "code", "type", "value", "minOrder", "maxUses", "usedCount", "startDate", "endDate", "status", "products", "description", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, UPPER($5), $6, $7, $8, $9, $10, $11::date, $12::date, $13, $14, $15, now(), now())`,
      id,
      actor.id,
      actor.email,
      name,
      code,
      type,
      value,
      minOrder,
      maxUses,
      usedCount,
      startDate,
      endDate,
      status,
      products,
      description,
    )

    const createdRows = await prismaDb.$queryRawUnsafe(
      `SELECT "id", "name", "code", "type", "value", "minOrder", "maxUses", "usedCount", "startDate", "endDate", "status", "products", "description"
       FROM "ShopkeeperPromotion"
       WHERE "id" = $1
       LIMIT 1`,
      id,
    ) as PromotionDbRow[]

    if (!createdRows.length) {
      return NextResponse.json({ ok: false, error: "Failed to save promotion" }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      data: toPromotionPayload(createdRows[0]),
    })
  } catch (error) {
    console.error("Shopkeeper promotions POST error:", error)
    return NextResponse.json(
      { ok: false, error: "Failed to create promotion" },
      { status: 500 },
    )
  }
}
