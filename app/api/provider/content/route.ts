import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionActor } from "@/lib/server/api-auth";

const prismaDb: any = db;

function parseJson(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    const rows = await prismaDb.authLog.findMany({
      where: {
        provider: "system",
        mode: "provider_post",
        email: actor.id,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, response: true, createdAt: true },
    });

    const posts = rows.map((row: any) => {
      const payload = parseJson(row.response) || {};
      const type = String(payload.type || "image");
      const media = Array.isArray(payload.media)
        ? payload.media.map((item) => String(item || "")).filter(Boolean)
        : [];

      return {
        id: row.id,
        type: type === "video" || type === "carousel" ? type : "image",
        caption: String(payload.caption || ""),
        status: String(payload.status || "published"),
        visibility: String(payload.visibility || "public"),
        isPinned: Boolean(payload.isPinned),
        media,
        thumbnail: String(payload.thumbnail || media[0] || "/placeholder.svg"),
        views: Number(payload.views || 0),
        likes: Number(payload.likes || 0),
        comments: Number(payload.comments || 0),
        shares: Number(payload.shares || 0),
        createdAt: row.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ ok: true, data: posts });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch content";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    const body = await request.json();
    const caption = String(body?.caption || "").trim();
    const type = String(body?.type || "image")
      .trim()
      .toLowerCase();
    const visibility = String(body?.visibility || "public")
      .trim()
      .toLowerCase();
    const media = Array.isArray(body?.media)
      ? body.media.map((item: unknown) => String(item || "")).filter(Boolean)
      : [];

    if (!caption) {
      return NextResponse.json(
        { ok: false, error: "caption is required" },
        { status: 400 },
      );
    }

    const payload = {
      caption,
      type: type === "video" || type === "carousel" ? type : "image",
      visibility:
        visibility === "private" || visibility === "followers"
          ? visibility
          : "public",
      media,
      thumbnail: String(body?.thumbnail || media[0] || "/placeholder.svg"),
      status: "published",
      isPinned: false,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
    };

    const row = await prismaDb.authLog.create({
      data: {
        provider: "system",
        mode: "provider_post",
        email: actor.id,
        status: "SUCCESS",
        response: JSON.stringify(payload),
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, data: { id: row.id } });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create post";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
