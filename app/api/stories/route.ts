import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/lib/server/db";
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth";

const prismaDb: any = db;

async function ensureStoryTable() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS "ProjectStory" (
      "id" TEXT PRIMARY KEY,
      "ownerUserId" TEXT NOT NULL,
      "ownerRole" TEXT NOT NULL,
      "ownerName" TEXT,
      "ownerAvatar" TEXT,
      "title" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "beforeImage" TEXT,
      "afterImage" TEXT,
      "thumbnail" TEXT,
      "duration" TEXT,
      "views" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "deletedAt" TIMESTAMP
    )`,
    'CREATE INDEX IF NOT EXISTS "ProjectStory_ownerUserId_idx" ON "ProjectStory" ("ownerUserId")',
    'CREATE INDEX IF NOT EXISTS "ProjectStory_createdAt_idx" ON "ProjectStory" ("createdAt")',
  ];

  for (const statement of statements) {
    await prismaDb.$executeRawUnsafe(statement);
  }
}

function toRelativeDate(value: Date): string {
  const diffMs = Date.now() - value.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return value.toLocaleDateString();
}

function normalizeText(value: unknown, maxLength: number) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.length > maxLength) return text.slice(0, maxLength);
  return text;
}

function normalizeImage(value: unknown, maxLength = 200000) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.length > maxLength) return "";
  return text;
}

export async function GET() {
  try {
    await ensureStoryTable();

    const stories = await prismaDb.$queryRawUnsafe(
      `SELECT
        "id",
        "ownerName",
        "ownerAvatar",
        "title",
        "type",
        "beforeImage",
        "afterImage",
        "thumbnail",
        "duration",
        "views",
        "createdAt"
      FROM "ProjectStory"
      WHERE "deletedAt" IS NULL
      ORDER BY "createdAt" DESC
      LIMIT 30`,
    );

    const data = (stories || []).map((story: any) => ({
      id: story.id,
      specialist: story.ownerName || "Shopkeeper",
      avatar: story.ownerAvatar || "/placeholder.svg",
      title: story.title || "Project Story",
      type: story.type || "before-after",
      beforeImage: story.beforeImage || story.thumbnail || "/placeholder.svg",
      afterImage:
        story.afterImage || story.thumbnail || story.beforeImage || "/placeholder.svg",
      thumbnail:
        story.thumbnail || story.afterImage || story.beforeImage || "/placeholder.svg",
      duration: story.duration || "15s",
      views: Number(story.views || 0),
      timestamp: toRelativeDate(new Date(story.createdAt || Date.now())),
    }));

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load stories";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    if (!hasAnyRole(actor, ["provider", "shopkeeper", "admin", "sub-admin", "subadmin"])) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    await ensureStoryTable();

    const payload = await request.json();
    const title = normalizeText(payload?.title, 120);
    const typeRaw = normalizeText(payload?.type, 20) || "before-after";
    const type = typeRaw === "timelapse" ? "timelapse" : "before-after";
    const beforeImage = normalizeImage(payload?.beforeImage);
    const afterImage = normalizeImage(payload?.afterImage);
    const thumbnail = normalizeImage(payload?.thumbnail) || afterImage || beforeImage;
    const duration = normalizeText(payload?.duration, 20) || "15s";

    if (!title) {
      return NextResponse.json(
        { ok: false, error: "Story title is required" },
        { status: 400 },
      );
    }

    if (!beforeImage || !afterImage) {
      return NextResponse.json(
        { ok: false, error: "Please add both before and after images" },
        { status: 400 },
      );
    }

    const owner = await prismaDb.user.findFirst({
      where: { id: actor.id, deletedAt: null },
      select: { name: true, image: true, role: true },
    });

    const id = randomUUID();
    const now = new Date();

    await prismaDb.$executeRawUnsafe(
      `INSERT INTO "ProjectStory" (
        "id",
        "ownerUserId",
        "ownerRole",
        "ownerName",
        "ownerAvatar",
        "title",
        "type",
        "beforeImage",
        "afterImage",
        "thumbnail",
        "duration",
        "views",
        "createdAt",
        "updatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      id,
      actor.id,
      String(owner?.role || actor.role || "shopkeeper"),
      owner?.name || actor.name || "Shopkeeper",
      owner?.image || "",
      title,
      type,
      beforeImage,
      afterImage,
      thumbnail,
      duration,
      0,
      now,
      now,
    );

    return NextResponse.json({
      ok: true,
      data: {
        id,
        specialist: owner?.name || actor.name || "Shopkeeper",
        avatar: owner?.image || "/placeholder.svg",
        title,
        type,
        beforeImage,
        afterImage,
        thumbnail,
        duration,
        views: 0,
        timestamp: toRelativeDate(now),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create story";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
