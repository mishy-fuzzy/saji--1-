import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth";

const prismaDb: any = db;

type ReviewPayload = {
  customer: string;
  avatar: string;
  product: string;
  rating: number;
  text: string;
  date: string;
  helpful: number;
  replied: boolean;
  reply: string;
  replyDate: string;
  reported?: boolean;
};

type ReviewDbRow = {
  id: string;
  customerName: string;
  customerAvatar: string;
  productName: string;
  rating: number;
  text: string;
  helpful: number;
  replied: boolean;
  reply: string;
  replyDate: Date | string | null;
  reported: boolean;
  createdAt: Date | string;
};

const DEFAULT_REVIEW: ReviewPayload = {
  customer: "Customer",
  avatar: "/placeholder.svg",
  product: "Service",
  rating: 0,
  text: "",
  date: "",
  helpful: 0,
  replied: false,
  reply: "",
  replyDate: "",
  reported: false,
};

function safeString(value: unknown): string {
  return String(value || "").trim();
}

function toIsoDateString(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value || ""));
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

function parseReview(raw: string | null | undefined): ReviewPayload {
  if (!raw) return DEFAULT_REVIEW;

  try {
    const parsed = JSON.parse(raw) as Partial<ReviewPayload>;
    return {
      customer: safeString(parsed.customer) || "Customer",
      avatar: safeString(parsed.avatar) || "/placeholder.svg",
      product: safeString(parsed.product) || "Service",
      rating: Math.max(0, Math.min(5, Number(parsed.rating || 0))),
      text: safeString(parsed.text),
      date: safeString(parsed.date),
      helpful: Math.max(0, Number(parsed.helpful || 0)),
      replied: Boolean(parsed.replied),
      reply: safeString(parsed.reply),
      replyDate: safeString(parsed.replyDate),
      reported: Boolean(parsed.reported),
    };
  } catch {
    return DEFAULT_REVIEW;
  }
}

function toReviewPayload(row: ReviewDbRow): ReviewPayload {
  return {
    customer: safeString(row.customerName) || "Customer",
    avatar: safeString(row.customerAvatar) || "/placeholder.svg",
    product: safeString(row.productName) || "Service",
    rating: Math.max(0, Math.min(5, Number(row.rating || 0))),
    text: safeString(row.text),
    date: new Date(String(row.createdAt || "")).toLocaleDateString(),
    helpful: Math.max(0, Number(row.helpful || 0)),
    replied: Boolean(row.replied),
    reply: safeString(row.reply),
    replyDate: toIsoDateString(row.replyDate),
    reported: Boolean(row.reported),
  };
}

async function ensureReviewTable() {
  await prismaDb.$executeRawUnsafe(`
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

  await prismaDb.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "ShopkeeperReview_shopkeeperUserId_idx" ON "ShopkeeperReview" ("shopkeeperUserId")',
  );
  await prismaDb.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "ShopkeeperReview_rating_idx" ON "ShopkeeperReview" ("rating")',
  );
}

export async function GET(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    if (!hasAnyRole(actor, ["shopkeeper", "admin", "sub-admin", "subadmin"])) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    await ensureReviewTable();

    const rows = (await prismaDb.$queryRawUnsafe(
      `SELECT "id", "customerName", "customerAvatar", "productName", "rating", "text", "helpful", "replied", "reply", "replyDate", "reported", "createdAt"
       FROM "ShopkeeperReview"
       WHERE "shopkeeperUserId" = $1 AND "deletedAt" IS NULL
       ORDER BY "createdAt" DESC
       LIMIT 300`,
      actor.id,
    )) as ReviewDbRow[];

    const reviews = rows.map((row) => {
      const parsed = toReviewPayload(row);
      return {
        id: String(row.id),
        customer: parsed.customer,
        avatar: parsed.avatar,
        product: parsed.product,
        rating: parsed.rating,
        text: parsed.text,
        date: parsed.date,
        helpful: parsed.helpful,
        replied: parsed.replied,
        reply: parsed.reply,
        replyDate: parsed.replyDate,
      };
    });

    return NextResponse.json({
      ok: true,
      data: {
        reviews,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load reviews";
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

    await ensureReviewTable();

    const body = await request.json().catch(() => ({}));
    const id = safeString(body?.id);
    const action = safeString(body?.action).toLowerCase();

    if (!id || !action) {
      return NextResponse.json({ ok: false, error: "id and action are required" }, { status: 400 });
    }

    const existingRows = (await prismaDb.$queryRawUnsafe(
      `SELECT "id", "customerName", "customerAvatar", "productName", "rating", "text", "helpful", "replied", "reply", "replyDate", "reported", "createdAt"
       FROM "ShopkeeperReview"
       WHERE "id" = $1 AND "shopkeeperUserId" = $2 AND "deletedAt" IS NULL
       LIMIT 1`,
      id,
      actor.id,
    )) as ReviewDbRow[];

    const row = existingRows[0];

    if (!row) {
      return NextResponse.json({ ok: false, error: "Review not found" }, { status: 404 });
    }

    const payload = toReviewPayload(row);

    if (action === "reply") {
      const replyText = safeString(body?.replyText);
      if (replyText.length < 3) {
        return NextResponse.json({ ok: false, error: "Reply text is too short" }, { status: 400 });
      }

      payload.replied = true;
      payload.reply = replyText;

      await prismaDb.$executeRawUnsafe(
        `UPDATE "ShopkeeperReview"
         SET "replied" = true, "reply" = $1, "replyDate" = now(), "updatedAt" = now()
         WHERE "id" = $2`,
        replyText,
        row.id,
      );
    } else if (action === "helpful") {
      await prismaDb.$executeRawUnsafe(
        `UPDATE "ShopkeeperReview"
         SET "helpful" = GREATEST(0, "helpful" + 1), "updatedAt" = now()
         WHERE "id" = $1`,
        row.id,
      );
    } else if (action === "report") {
      await prismaDb.$executeRawUnsafe(
        `UPDATE "ShopkeeperReview"
         SET "reported" = true, "updatedAt" = now()
         WHERE "id" = $1`,
        row.id,
      );
    } else {
      return NextResponse.json({ ok: false, error: "Unsupported action" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update review";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
