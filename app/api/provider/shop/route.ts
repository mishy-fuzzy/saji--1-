import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth"
import { randomUUID } from "crypto"

const prismaDb: any = db

async function ensureProviderShopTable() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS "ProviderShop" (
      "id" TEXT PRIMARY KEY,
      "ownerUserId" TEXT NOT NULL UNIQUE,
      "name" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "location" TEXT NOT NULL,
      "phone" TEXT NOT NULL,
      "permitNumber" TEXT,
      "kraPin" TEXT,
      "registeredAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "deletedAt" TIMESTAMP
    )`,
    'CREATE INDEX IF NOT EXISTS "ProviderShop_ownerUserId_idx" ON "ProviderShop" ("ownerUserId")',
    'CREATE INDEX IF NOT EXISTS "ProviderShop_category_idx" ON "ProviderShop" ("category")',
  ]

  for (const statement of statements) {
    await prismaDb.$executeRawUnsafe(statement)
  }
}

function toText(value: unknown): string {
  return String(value || "").trim()
}

async function getShop(ownerUserId: string) {
  return prismaDb.$queryRawUnsafe<
    Array<{
      id: string
      ownerUserId: string
      name: string
      description: string
      category: string
      location: string
      phone: string
      permitNumber: string | null
      kraPin: string | null
      registeredAt: Date
      updatedAt: Date
      deletedAt: Date | null
    }>
  >(
    `SELECT * FROM "ProviderShop" WHERE "ownerUserId" = $1 AND "deletedAt" IS NULL LIMIT 1`,
    ownerUserId,
  )
}

export async function GET(request: Request) {
  try {
    await ensureProviderShopTable()

    const { actor, error } = await getSessionActor(request)
    if (error || !actor) return error

    if (!hasAnyRole(actor, ["provider", "shopkeeper", "admin"])) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
    }

    const rows = await getShop(actor.id)
    const shop = rows[0]

    return NextResponse.json({
      ok: true,
      data: shop
        ? {
            registered: true,
            name: shop.name,
            description: shop.description,
            category: shop.category,
            location: shop.location,
            phone: shop.phone,
            permitNumber: shop.permitNumber || "",
            kraPin: shop.kraPin || "",
            registeredAt: shop.registeredAt,
            updatedAt: shop.updatedAt,
          }
        : {
            registered: false,
          },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load shop"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await ensureProviderShopTable()

    const { actor, error } = await getSessionActor(request)
    if (error || !actor) return error

    if (!hasAnyRole(actor, ["provider", "shopkeeper", "admin"])) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const name = toText(body?.name)
    const description = toText(body?.description)
    const category = toText(body?.category) || "General Store"
    const location = toText(body?.location)
    const phone = toText(body?.phone)
    const permitNumber = toText(body?.permitNumber)
    const kraPin = toText(body?.kraPin)

    if (!name || !description || !location || !phone) {
      return NextResponse.json(
        { ok: false, error: "name, description, location, and phone are required" },
        { status: 400 },
      )
    }

    const existing = await getShop(actor.id)

    if (existing.length > 0) {
      const updated = await prismaDb.$queryRawUnsafe<Array<any>>(
        `UPDATE "ProviderShop"
         SET "name" = $2,
             "description" = $3,
             "category" = $4,
             "location" = $5,
             "phone" = $6,
             "permitNumber" = $7,
             "kraPin" = $8,
             "updatedAt" = NOW(),
             "deletedAt" = NULL
         WHERE "ownerUserId" = $1
         RETURNING *`,
        actor.id,
        name,
        description,
        category,
        location,
        phone,
        permitNumber || null,
        kraPin || null,
      )

      const shop = updated[0]
      return NextResponse.json({
        ok: true,
        data: {
          registered: true,
          name: shop.name,
          description: shop.description,
          category: shop.category,
          location: shop.location,
          phone: shop.phone,
          permitNumber: shop.permitNumber || "",
          kraPin: shop.kraPin || "",
        },
      })
    }

    const inserted = await prismaDb.$queryRawUnsafe<Array<any>>(
      `INSERT INTO "ProviderShop" (
        "id",
        "ownerUserId",
        "name",
        "description",
        "category",
        "location",
        "phone",
        "permitNumber",
        "kraPin"
      ) VALUES ($9, $1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      actor.id,
      name,
      description,
      category,
      location,
      phone,
      permitNumber || null,
      kraPin || null,
      randomUUID(),
    )

    const shop = inserted[0]
    return NextResponse.json({
      ok: true,
      data: {
        registered: true,
        name: shop.name,
        description: shop.description,
        category: shop.category,
        location: shop.location,
        phone: shop.phone,
        permitNumber: shop.permitNumber || "",
        kraPin: shop.kraPin || "",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save shop"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}