import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth";

const prismaDb: any = db;

function toText(value: unknown): string {
  return String(value || "").trim();
}

function toInt(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.round(parsed));
}

export async function GET(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    const sessions = await prismaDb.liveSession.findMany({
      where: { deletedAt: null, status: "live" },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: {
        host: {
          select: { id: true, name: true, image: true, role: true },
        },
      },
    });

    return NextResponse.json({ ok: true, data: sessions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load live sessions";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    if (!hasAnyRole(actor, ["provider", "shopkeeper", "admin", "sub-admin", "subadmin"])) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const kind = toText(body?.kind) === "workshop" ? "workshop" : "provider";
    const title = toText(body?.title) || "Live Session";
    const category = toText(body?.category) || null;
    const description = toText(body?.description) || null;
    const thumbnail = toText(body?.thumbnail) || null;
    const joinFee = toInt(body?.joinFee, 0);
    const viewers = toInt(body?.viewers, 0);

    const existing = await prismaDb.liveSession.findFirst({
      where: {
        hostUserId: actor.id,
        deletedAt: null,
        status: "live",
      },
      select: { id: true },
    });

    const payload = {
      hostUserId: actor.id,
      kind,
      title,
      category,
      description,
      thumbnail,
      joinFee,
      viewers,
      status: "live",
      startsAt: new Date(),
      endsAt: null,
      deletedAt: null,
    };

    const session = existing
      ? await prismaDb.liveSession.update({
          where: { id: existing.id },
          data: payload,
        })
      : await prismaDb.liveSession.create({
          data: payload,
        });

    return NextResponse.json({ ok: true, data: session });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start live session";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    if (!hasAnyRole(actor, ["provider", "shopkeeper", "admin", "sub-admin", "subadmin"])) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = toText(searchParams.get("id"));

    const session = id
      ? await prismaDb.liveSession.findFirst({
          where: { id, hostUserId: actor.id, deletedAt: null },
          select: { id: true },
        })
      : await prismaDb.liveSession.findFirst({
          where: { hostUserId: actor.id, deletedAt: null, status: "live" },
          orderBy: { updatedAt: "desc" },
          select: { id: true },
        });

    if (!session) {
      return NextResponse.json({ ok: true, data: null });
    }

    await prismaDb.liveSession.update({
      where: { id: session.id },
      data: {
        status: "ended",
        endsAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to stop live session";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth";

const prismaDb: any = db;

function safeText(value: unknown): string {
  return String(value || "").trim();
}

async function ensureLiveSessionTable() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS "LiveSession" (
      "id" TEXT PRIMARY KEY,
      "hostUserId" TEXT NOT NULL,
      "kind" TEXT NOT NULL,
      "title" TEXT,
      "category" TEXT,
      "description" TEXT,
      "thumbnail" TEXT,
      "joinFee" INTEGER,
      "viewers" INTEGER NOT NULL DEFAULT 0,
      "status" TEXT NOT NULL DEFAULT 'live',
      "startsAt" TIMESTAMP,
      "endsAt" TIMESTAMP,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "deletedAt" TIMESTAMP
    )`,
    'CREATE INDEX IF NOT EXISTS "LiveSession_hostUserId_idx" ON "LiveSession" ("hostUserId")',
    'CREATE INDEX IF NOT EXISTS "LiveSession_kind_status_idx" ON "LiveSession" ("kind", "status")',
    'CREATE INDEX IF NOT EXISTS "LiveSession_status_updatedAt_idx" ON "LiveSession" ("status", "updatedAt")',
  ];

  for (const statement of statements) {
    await prismaDb.$executeRawUnsafe(statement);
  }
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(request: Request) {
  try {
    await ensureLiveSessionTable();
    const { searchParams } = new URL(request.url);
    const kind = safeText(searchParams.get("kind")) || null;
    const status = safeText(searchParams.get("status")) || "live";
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit") || 20), 1),
      50,
    );

    const sessions = await prismaDb.liveSession.findMany({
      where: {
        deletedAt: null,
        status,
        ...(kind ? { kind } : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });

    const hostIds = Array.from(new Set(sessions.map((s: any) => s.hostUserId)));
    const hosts = hostIds.length
      ? await prismaDb.user.findMany({
          where: { id: { in: hostIds }, deletedAt: null },
          select: { id: true, name: true, image: true },
        })
      : [];
    const hostMap = new Map((hosts || []).map((host: any) => [host.id, host]));

    const data = sessions.map((session: any) => {
      const host = hostMap.get(session.hostUserId);
      return {
        ...session,
        hostName: host?.name || null,
        hostAvatar: host?.image || null,
      };
    });

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load live sessions";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    if (!hasAnyRole(actor, ["provider", "shopkeeper", "admin", "sub-admin", "subadmin"])) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    await ensureLiveSessionTable();

    const body = await request.json().catch(() => ({}));
    const kind = safeText(body?.kind) || "provider";
    if (!(["provider", "workshop"] as const).includes(kind as "provider" | "workshop")) {
      return NextResponse.json(
        { ok: false, error: "kind must be provider or workshop" },
        { status: 400 },
      );
    }

    const status = safeText(body?.status) || "live";
    const title = safeText(body?.title) || null;
    const category = safeText(body?.category) || null;
    const description = safeText(body?.description) || null;
    const thumbnail = safeText(body?.thumbnail) || null;
    const joinFee = Number.isFinite(body?.joinFee) ? Number(body.joinFee) : null;
    const viewers = Number.isFinite(body?.viewers) ? Number(body.viewers) : 0;
    const startsAt = parseDate(body?.startsAt);
    const endsAt = parseDate(body?.endsAt);

    const session = await prismaDb.liveSession.create({
      data: {
        hostUserId: actor.id,
        kind,
        status,
        title,
        category,
        description,
        thumbnail,
        joinFee,
        viewers,
        startsAt,
        endsAt,
      },
    });

    return NextResponse.json({ ok: true, data: session });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create live session";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    await ensureLiveSessionTable();

    const body = await request.json().catch(() => ({}));
    const id = safeText(body?.id);
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "id is required" },
        { status: 400 },
      );
    }

    const existing = await prismaDb.liveSession.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Session not found" },
        { status: 404 },
      );
    }

    const isAdmin = hasAnyRole(actor, ["admin", "sub-admin", "subadmin"]);
    if (!isAdmin && existing.hostUserId !== actor.id) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const updates = {
      title: safeText(body?.title) || undefined,
      category: safeText(body?.category) || undefined,
      description: safeText(body?.description) || undefined,
      thumbnail: safeText(body?.thumbnail) || undefined,
      joinFee: Number.isFinite(body?.joinFee) ? Number(body.joinFee) : undefined,
      viewers: Number.isFinite(body?.viewers) ? Number(body.viewers) : undefined,
      status: safeText(body?.status) || undefined,
      startsAt: parseDate(body?.startsAt) || undefined,
      endsAt: parseDate(body?.endsAt) || undefined,
    };

    const session = await prismaDb.liveSession.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ ok: true, data: session });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update live session";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
