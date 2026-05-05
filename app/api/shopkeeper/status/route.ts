import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth";

const prismaDb: any = db;

function safeText(value: unknown): string {
  return String(value || "").trim();
}

async function ensureShopOperationalStatusTable() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS "ShopOperationalStatus" (
      "id" TEXT PRIMARY KEY,
      "shopkeeperUserId" TEXT NOT NULL,
      "isOpen" BOOLEAN NOT NULL DEFAULT false,
      "deliveryPercent" INTEGER,
      "matchedByAI" BOOLEAN NOT NULL DEFAULT false,
      "statusMessage" TEXT,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )`,
    'CREATE UNIQUE INDEX IF NOT EXISTS "ShopOperationalStatus_shopkeeperUserId_idx" ON "ShopOperationalStatus" ("shopkeeperUserId")',
    'CREATE INDEX IF NOT EXISTS "ShopOperationalStatus_isOpen_idx" ON "ShopOperationalStatus" ("isOpen")',
  ];

  for (const statement of statements) {
    await prismaDb.$executeRawUnsafe(statement);
  }
}

export async function GET(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    if (!hasAnyRole(actor, ["shopkeeper", "admin", "sub-admin", "subadmin"])) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    await ensureShopOperationalStatusTable();

    const { searchParams } = new URL(request.url);
    const targetId =
      hasAnyRole(actor, ["admin", "sub-admin", "subadmin"]) &&
      safeText(searchParams.get("shopkeeperUserId"))
        ? safeText(searchParams.get("shopkeeperUserId"))
        : actor.id;

    const status = await prismaDb.shopOperationalStatus.findFirst({
      where: { shopkeeperUserId: targetId },
    });

    return NextResponse.json({ ok: true, data: status || null });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load shop operational status";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    if (!hasAnyRole(actor, ["shopkeeper", "admin", "sub-admin", "subadmin"])) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    await ensureShopOperationalStatusTable();

    const body = await request.json().catch(() => ({}));
    const targetId = safeText(body?.shopkeeperUserId) || actor.id;

    if (
      !hasAnyRole(actor, ["admin", "sub-admin", "subadmin"]) &&
      targetId !== actor.id
    ) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const hasDeliveryPercent = body?.deliveryPercent !== undefined;
    const deliveryPercent = hasDeliveryPercent
      ? Number.isFinite(body?.deliveryPercent)
        ? Number(body.deliveryPercent)
        : null
      : null;

    const status = await prismaDb.shopOperationalStatus.upsert({
      where: { shopkeeperUserId: targetId },
      update: {
        isOpen: typeof body?.isOpen === "boolean" ? body.isOpen : undefined,
        deliveryPercent: hasDeliveryPercent ? deliveryPercent : undefined,
        matchedByAI:
          typeof body?.matchedByAI === "boolean" ? body.matchedByAI : undefined,
        statusMessage: safeText(body?.statusMessage) || null,
      },
      create: {
        shopkeeperUserId: targetId,
        isOpen: Boolean(body?.isOpen),
        deliveryPercent,
        matchedByAI: Boolean(body?.matchedByAI),
        statusMessage: safeText(body?.statusMessage) || null,
      },
    });

    return NextResponse.json({ ok: true, data: status });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update shop operational status";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
