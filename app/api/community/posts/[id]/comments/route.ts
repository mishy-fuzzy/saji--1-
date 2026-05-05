import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionActor } from "@/lib/server/api-auth";

const prismaDb: any = db;

type StoredComment = {
  authorId?: unknown;
  body?: unknown;
};

type CommentRow = {
  id: string;
  response: string | null;
  createdAt: Date;
};

function safeText(value: unknown): string {
  return String(value || "").trim();
}

function parseStoredComment(raw: string | null) {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredComment;
    const authorId = safeText(parsed?.authorId);
    const body = safeText(parsed?.body);

    if (!authorId || !body) return null;
    return { authorId, body };
  } catch {
    return null;
  }
}

function buildAvatar(value: string | null | undefined): string {
  return safeText(value) || "/placeholder.svg";
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const serviceId = safeText(id);

    if (!serviceId) {
      return NextResponse.json(
        { ok: false, error: "Post id is required" },
        { status: 400 },
      );
    }

    const service = await prismaDb.service.findFirst({
      where: { id: serviceId },
      select: { id: true },
    });

    if (!service) {
      return NextResponse.json(
        { ok: false, error: "Post not found" },
        { status: 404 },
      );
    }

    const rows = (await prismaDb.authLog.findMany({
      where: {
        provider: "community",
        mode: "comment",
        email: serviceId,
        status: { not: "DELETED" },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, response: true, createdAt: true },
    })) as CommentRow[];

    const parsed = rows
      .map((row) => {
        const payload = parseStoredComment(row.response);
        if (!payload) return null;
        return {
          id: row.id,
          body: payload.body,
          authorId: payload.authorId,
          createdAt: row.createdAt,
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      body: string;
      authorId: string;
      createdAt: Date;
    }>;

    const authorIds = Array.from(
      new Set(parsed.map((entry) => entry.authorId).filter(Boolean)),
    );

    const authors = await prismaDb.user.findMany({
      where: { id: { in: authorIds }, deletedAt: null },
      select: { id: true, name: true, image: true },
    });

    const authorMap = new Map(
      authors.map((author: any) => [
        String(author.id || ""),
        {
          id: String(author.id || ""),
          name: author.name || "User",
          avatar: buildAvatar(author.image),
        },
      ]),
    );

    const comments = parsed.map((entry) => ({
      id: entry.id,
      body: entry.body,
      createdAt: entry.createdAt,
      author: authorMap.get(entry.authorId) || {
        id: entry.authorId,
        name: "User",
        avatar: "/placeholder.svg",
      },
    }));

    return NextResponse.json({ ok: true, data: comments });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load comments";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    const { id } = await context.params;
    const serviceId = safeText(id);

    if (!serviceId) {
      return NextResponse.json(
        { ok: false, error: "Post id is required" },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const commentBody = safeText(body?.body);

    if (!commentBody) {
      return NextResponse.json(
        { ok: false, error: "Comment is required" },
        { status: 400 },
      );
    }

    const service = await prismaDb.service.findFirst({
      where: { id: serviceId },
      select: { id: true },
    });

    if (!service) {
      return NextResponse.json(
        { ok: false, error: "Post not found" },
        { status: 404 },
      );
    }

    const saved = await prismaDb.authLog.create({
      data: {
        provider: "community",
        mode: "comment",
        email: serviceId,
        status: "ACTIVE",
        response: JSON.stringify({
          authorId: actor.id,
          body: commentBody,
        }),
      },
      select: { id: true, createdAt: true },
    });

    const user = await prismaDb.user.findFirst({
      where: { id: actor.id, deletedAt: null },
      select: { id: true, name: true, image: true },
    });

    return NextResponse.json({
      ok: true,
      data: {
        id: saved.id,
        body: commentBody,
        createdAt: saved.createdAt,
        author: {
          id: actor.id,
          name: user?.name || actor.name || "User",
          avatar: buildAvatar(user?.image),
        },
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to add comment";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
