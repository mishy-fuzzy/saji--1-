import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth"

const prismaDb: any = db

type PromotionStatus = "active" | "scheduled" | "expired" | "paused"

type PromotionPayload = {
  id?: string
  name: string
  code: string
  type: "percentage" | "fixed"
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
  ownerUserId: string
  ownerEmail: string | null
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

function parsePromotion(raw: string | null | undefined): PromotionPayload | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<PromotionPayload>
    return {
      name: String(parsed.name || "").trim(),
      code: String(parsed.code || "").trim().toUpperCase(),
      type: String(parsed.type || "percentage") === "fixed" ? "fixed" : "percentage",
      value: Number(parsed.value || 0),
      minOrder: Number(parsed.minOrder || 0),
      maxUses: Number(parsed.maxUses || 0),
      usedCount: Number(parsed.usedCount || 0),
      startDate: String(parsed.startDate || ""),
      endDate: String(parsed.endDate || ""),
      status: normalizeStatus(String(parsed.status || "active")),
      products: String(parsed.products || "").trim(),
      description: String(parsed.description || "").trim(),
    }
  } catch {
    return null
  }
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
    'CREATE UNIQUE INDEX IF NOT EXISTS "ShopkeeperPromotion_owner_code_active_uniq" ON "ShopkeeperPromotion" ("ownerUserId", "code") WHERE "deletedAt" IS NULL',
  )
}

async function getOwnedPromotion(id: string, ownerUserId: string): Promise<PromotionDbRow | null> {
  const rows = await prismaDb.$queryRawUnsafe(
    `SELECT "id", "ownerUserId", "ownerEmail", "name", "code", "type", "value", "minOrder", "maxUses", "usedCount", "startDate", "endDate", "status", "products", "description"
     FROM "ShopkeeperPromotion"
     WHERE "id" = $1 AND "ownerUserId" = $2 AND "deletedAt" IS NULL
     LIMIT 1`,
    id,
    ownerUserId,
  ) as PromotionDbRow[]

  return rows[0] || null
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { actor, error } = await getSessionActor(request)
    if (error || !actor) return error

    if (!hasAnyRole(actor, ["shopkeeper", "admin", "sub-admin", "subadmin"])) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
    }

    await ensurePromotionTable()

    const { id } = await context.params
    const existing = await getOwnedPromotion(String(id), actor.id)
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Promotion not found" }, { status: 404 })
    }

    const current = toPromotionPayload(existing)

    const body = await request.json().catch(() => ({}))
    const nextDraft: PromotionPayload = {
      ...current,
      name: body?.name !== undefined ? String(body.name || "").trim() : current.name,
      code: body?.code !== undefined ? String(body.code || "").trim().toUpperCase() : current.code,
      type: body?.type === "fixed" ? "fixed" : body?.type === "percentage" ? "percentage" : current.type,
      value: body?.value !== undefined ? Math.max(0, Number(body.value || 0)) : current.value,
      minOrder: body?.minOrder !== undefined ? Math.max(0, Number(body.minOrder || 0)) : current.minOrder,
      maxUses: body?.maxUses !== undefined ? Math.max(0, Number(body.maxUses || 0)) : current.maxUses,
      usedCount: body?.usedCount !== undefined ? Math.max(0, Number(body.usedCount || 0)) : current.usedCount,
      startDate: body?.startDate !== undefined ? String(body.startDate || "").trim() : current.startDate,
      endDate: body?.endDate !== undefined ? String(body.endDate || "").trim() : current.endDate,
      products: body?.products !== undefined ? String(body.products || "").trim() : current.products,
      description: body?.description !== undefined ? String(body.description || "").trim() : current.description,
      status: current.status,
    }

    if (!nextDraft.name || !nextDraft.code || nextDraft.value <= 0) {
      return NextResponse.json(
        { ok: false, error: "name, code and value are required" },
        { status: 400 },
      )
    }

    if (!nextDraft.startDate || !nextDraft.endDate) {
      return NextResponse.json(
        { ok: false, error: "startDate and endDate are required" },
        { status: 400 },
      )
    }

    const nextStatus = computeStatus(
      nextDraft.startDate,
      nextDraft.endDate,
      String(body?.status || nextDraft.status),
    )

    const next: PromotionPayload = {
      ...nextDraft,
      status: nextStatus,
    }

    const duplicate = await prismaDb.$queryRawUnsafe(
      `SELECT "id" FROM "ShopkeeperPromotion"
       WHERE "ownerUserId" = $1
         AND UPPER("code") = UPPER($2)
         AND "deletedAt" IS NULL
         AND "id" <> $3
       LIMIT 1`,
      actor.id,
      next.code,
      existing.id,
    ) as Array<{ id: string }>

    if (duplicate.length > 0) {
      return NextResponse.json({ ok: false, error: "Promotion code already exists" }, { status: 409 })
    }

    await prismaDb.$executeRawUnsafe(
      `UPDATE "ShopkeeperPromotion"
       SET
         "name" = $1,
         "code" = UPPER($2),
         "type" = $3,
         "value" = $4,
         "minOrder" = $5,
         "maxUses" = $6,
         "usedCount" = $7,
         "startDate" = $8::date,
         "endDate" = $9::date,
         "status" = $10,
         "products" = $11,
         "description" = $12,
         "updatedAt" = now()
       WHERE "id" = $13`,
      next.name,
      next.code,
      next.type,
      next.value,
      next.minOrder,
      next.maxUses,
      next.usedCount,
      next.startDate,
      next.endDate,
      next.status,
      next.products,
      next.description,
      existing.id,
    )

    const refreshed = await getOwnedPromotion(existing.id, actor.id)
    if (!refreshed) {
      return NextResponse.json({ ok: false, error: "Failed to update promotion" }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      data: toPromotionPayload(refreshed),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update promotion"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { actor, error } = await getSessionActor(request)
    if (error || !actor) return error

    if (!hasAnyRole(actor, ["shopkeeper", "admin", "sub-admin", "subadmin"])) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
    }

    await ensurePromotionTable()

    const { id } = await context.params
    const existing = await getOwnedPromotion(String(id), actor.id)

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Promotion not found" }, { status: 404 })
    }

    await prismaDb.$executeRawUnsafe(
      `UPDATE "ShopkeeperPromotion"
       SET "deletedAt" = now(), "updatedAt" = now()
       WHERE "id" = $1`,
      existing.id,
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete promotion"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
