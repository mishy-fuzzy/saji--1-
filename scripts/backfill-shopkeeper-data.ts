import { PrismaClient } from "@prisma/client";

type LegacyAuthLogRow = {
  id: string;
  email: string | null;
  mode: string;
  status: string;
  response: string | null;
  createdAt: Date;
};

type ResolvedUser = {
  id: string;
  email: string;
};

type BackfillCounters = {
  scanned: number;
  inserted: number;
  skippedInvalid: number;
  skippedMissingOwner: number;
  skippedExisting: number;
  failed: number;
};

const prisma = new PrismaClient();

function safeString(value: unknown): string {
  return String(value || "").trim();
}

function safeNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return num;
}

function safeInt(value: unknown, fallback = 0): number {
  return Math.max(0, Math.round(safeNumber(value, fallback)));
}

function parseJsonObject(raw: string | null | undefined): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function asDate(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function toDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function computePromotionStatus(startDate: Date, endDate: Date, requestedStatus: unknown): string {
  const normalized = safeString(requestedStatus).toLowerCase();
  if (normalized === "paused") return "paused";
  const now = new Date();
  if (now < startDate) return "scheduled";
  if (now > endDate) return "expired";
  return "active";
}

async function ensureTargetTables() {
  await prisma.$executeRawUnsafe(`
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
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ShopkeeperReview" (
      "id" TEXT PRIMARY KEY,
      "shopkeeperUserId" TEXT NOT NULL,
      "customerUserId" TEXT,
      "customerName" TEXT NOT NULL,
      "customerAvatar" TEXT NOT NULL DEFAULT '/placeholder.svg',
      "productName" TEXT NOT NULL DEFAULT 'Service',
      "rating" INTEGER NOT NULL DEFAULT 0,
      "text" TEXT NOT NULL DEFAULT '',
      "helpful" INTEGER NOT NULL DEFAULT 0,
      "replied" BOOLEAN NOT NULL DEFAULT false,
      "reply" TEXT NOT NULL DEFAULT '',
      "replyDate" TIMESTAMPTZ,
      "reported" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "deletedAt" TIMESTAMPTZ
    )
  `);

  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "ShopkeeperPromotion_owner_code_active_uniq" ON "ShopkeeperPromotion" ("ownerUserId", "code") WHERE "deletedAt" IS NULL',
  );
}

const resolvedById = new Map<string, ResolvedUser | null>();
const resolvedByEmail = new Map<string, ResolvedUser | null>();

async function resolveUser(identifier: unknown): Promise<ResolvedUser | null> {
  const value = safeString(identifier);
  if (!value) return null;

  if (value.includes("@")) {
    const emailKey = value.toLowerCase();
    if (resolvedByEmail.has(emailKey)) return resolvedByEmail.get(emailKey) || null;

    const row = await prisma.user.findUnique({
      where: { email: value },
      select: { id: true, email: true },
    });
    const resolved = row ? { id: row.id, email: row.email } : null;
    resolvedByEmail.set(emailKey, resolved);
    if (resolved) resolvedById.set(resolved.id, resolved);
    return resolved;
  }

  if (resolvedById.has(value)) return resolvedById.get(value) || null;

  const row = await prisma.user.findUnique({
    where: { id: value },
    select: { id: true, email: true },
  });
  const resolved = row ? { id: row.id, email: row.email } : null;
  resolvedById.set(value, resolved);
  if (resolved) resolvedByEmail.set(resolved.email.toLowerCase(), resolved);
  return resolved;
}

async function findShopkeeperForLog(
  logEmail: unknown,
  payload: Record<string, unknown>,
): Promise<ResolvedUser | null> {
  const candidates = [
    payload.shopkeeperUserId,
    payload.ownerUserId,
    payload.userId,
    payload.shopkeeperId,
    logEmail,
  ];

  for (const candidate of candidates) {
    const resolved = await resolveUser(candidate);
    if (resolved) return resolved;
  }

  return null;
}

async function backfillPromotions(rows: LegacyAuthLogRow[]): Promise<BackfillCounters> {
  const counters: BackfillCounters = {
    scanned: 0,
    inserted: 0,
    skippedInvalid: 0,
    skippedMissingOwner: 0,
    skippedExisting: 0,
    failed: 0,
  };

  for (const row of rows) {
    counters.scanned += 1;

    const payload = parseJsonObject(row.response);
    if (!payload) {
      counters.skippedInvalid += 1;
      continue;
    }

    const owner = await findShopkeeperForLog(row.email, payload);
    if (!owner) {
      counters.skippedMissingOwner += 1;
      continue;
    }

    const code = safeString(payload.code).toUpperCase();
    const value = safeNumber(payload.value, 0);
    const type = safeString(payload.type).toLowerCase() === "fixed" ? "fixed" : "percentage";

    if (!code || value <= 0) {
      counters.skippedInvalid += 1;
      continue;
    }

    const existing = (await prisma.$queryRawUnsafe(
      `SELECT "id" FROM "ShopkeeperPromotion"
       WHERE "ownerUserId" = $1 AND UPPER("code") = UPPER($2) AND "deletedAt" IS NULL
       LIMIT 1`,
      owner.id,
      code,
    )) as Array<{ id: string }>;

    if (existing.length > 0) {
      counters.skippedExisting += 1;
      continue;
    }

    const startDate = asDate(payload.startDate) || row.createdAt;
    const endDate =
      asDate(payload.endDate) ||
      new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (endDate < startDate) {
      counters.skippedInvalid += 1;
      continue;
    }

    const name = safeString(payload.name) || `Promotion ${code}`;
    const minOrder = Math.max(0, safeNumber(payload.minOrder, 0));
    const maxUses = safeInt(payload.maxUses, 0);
    const usedCount = Math.max(0, Math.min(safeInt(payload.usedCount, 0), maxUses || Number.MAX_SAFE_INTEGER));
    const products = safeString(payload.products);
    const description = safeString(payload.description);
    const status = computePromotionStatus(startDate, endDate, payload.status);

    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "ShopkeeperPromotion" (
          "id", "ownerUserId", "ownerEmail", "name", "code", "type", "value", "minOrder", "maxUses", "usedCount", "startDate", "endDate", "status", "products", "description", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, UPPER($5), $6, $7, $8, $9, $10, $11::date, $12::date, $13, $14, $15, $16, $17)
        ON CONFLICT ("id") DO NOTHING`,
        row.id,
        owner.id,
        owner.email,
        name,
        code,
        type,
        value,
        minOrder,
        maxUses,
        usedCount,
        toDateOnly(startDate),
        toDateOnly(endDate),
        status,
        products,
        description,
        row.createdAt,
        row.createdAt,
      );

      counters.inserted += 1;
    } catch {
      counters.failed += 1;
    }
  }

  return counters;
}

async function backfillReviews(rows: LegacyAuthLogRow[]): Promise<BackfillCounters> {
  const counters: BackfillCounters = {
    scanned: 0,
    inserted: 0,
    skippedInvalid: 0,
    skippedMissingOwner: 0,
    skippedExisting: 0,
    failed: 0,
  };

  for (const row of rows) {
    counters.scanned += 1;

    const payload = parseJsonObject(row.response);
    if (!payload) {
      counters.skippedInvalid += 1;
      continue;
    }

    const owner = await findShopkeeperForLog(row.email, payload);
    if (!owner) {
      counters.skippedMissingOwner += 1;
      continue;
    }

    const existing = (await prisma.$queryRawUnsafe(
      `SELECT "id" FROM "ShopkeeperReview" WHERE "id" = $1 LIMIT 1`,
      row.id,
    )) as Array<{ id: string }>;

    if (existing.length > 0) {
      counters.skippedExisting += 1;
      continue;
    }

    const customerName = safeString(payload.customer || payload.customerName) || "Customer";
    const customerAvatar = safeString(payload.avatar || payload.customerAvatar) || "/placeholder.svg";
    const productName = safeString(payload.product || payload.productName) || "Service";
    const rating = Math.max(0, Math.min(5, safeInt(payload.rating, 0)));
    const text = safeString(payload.text || payload.review);
    const helpful = safeInt(payload.helpful, 0);
    const replied = Boolean(payload.replied);
    const reply = safeString(payload.reply);
    const replyDate = asDate(payload.replyDate);
    const reported = Boolean(payload.reported);
    const customerUser = await resolveUser(payload.customerUserId || payload.customerId);
    const createdAt = asDate(payload.date) || row.createdAt;

    if (!text) {
      counters.skippedInvalid += 1;
      continue;
    }

    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "ShopkeeperReview" (
          "id", "shopkeeperUserId", "customerUserId", "customerName", "customerAvatar", "productName", "rating", "text", "helpful", "replied", "reply", "replyDate", "reported", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT ("id") DO NOTHING`,
        row.id,
        owner.id,
        customerUser?.id || null,
        customerName,
        customerAvatar,
        productName,
        rating,
        text,
        helpful,
        replied,
        reply,
        replyDate,
        reported,
        createdAt,
        createdAt,
      );

      counters.inserted += 1;
    } catch {
      counters.failed += 1;
    }
  }

  return counters;
}

async function main() {
  await ensureTargetTables();

  const promotionRows = (await prisma.authLog.findMany({
    where: {
      provider: "local",
      mode: { in: ["shopkeeper-promotion", "shopkeeper-promotions"] },
      status: { not: "DELETED" },
      response: { not: null },
    },
    select: {
      id: true,
      email: true,
      mode: true,
      status: true,
      response: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
    take: 50000,
  })) as LegacyAuthLogRow[];

  const reviewRows = (await prisma.authLog.findMany({
    where: {
      provider: "local",
      mode: { in: ["shopkeeper-review", "shopkeeper-reviews"] },
      status: { not: "DELETED" },
      response: { not: null },
    },
    select: {
      id: true,
      email: true,
      mode: true,
      status: true,
      response: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
    take: 50000,
  })) as LegacyAuthLogRow[];

  const promotionStats = await backfillPromotions(promotionRows);
  const reviewStats = await backfillReviews(reviewRows);

  console.log("Backfill completed");
  console.log(
    JSON.stringify(
      {
        promotions: promotionStats,
        reviews: reviewStats,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
