import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionActor } from "@/lib/server/api-auth";

const prismaDb: any = db;

function parseJson(value: string | null) {
  if (!value) return {};
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    const { id } = await context.params;
    const body = await request.json();

    const row = await prismaDb.authLog.findFirst({
      where: {
        id: String(id),
        provider: "system",
        mode: "provider_post",
        email: actor.id,
      },
      select: { id: true, response: true },
    });

    if (!row) {
      return NextResponse.json(
        { ok: false, error: "Post not found" },
        { status: 404 },
      );
    }

    const payload = parseJson(row.response);
    const updatedPayload = {
      ...payload,
      ...(body?.caption !== undefined ? { caption: String(body.caption) } : {}),
      ...(body?.type !== undefined ? { type: String(body.type) } : {}),
      ...(body?.visibility !== undefined
        ? { visibility: String(body.visibility) }
        : {}),
      ...(body?.status !== undefined ? { status: String(body.status) } : {}),
      ...(body?.isPinned !== undefined
        ? { isPinned: Boolean(body.isPinned) }
        : {}),
      ...(body?.thumbnail !== undefined
        ? { thumbnail: String(body.thumbnail) }
        : {}),
      ...(Array.isArray(body?.media)
        ? {
            media: body.media
              .map((item: unknown) => String(item || ""))
              .filter(Boolean),
          }
        : {}),
    };

    await prismaDb.authLog.update({
      where: { id: row.id },
      data: { response: JSON.stringify(updatedPayload) },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update post";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    const { id } = await context.params;
    const row = await prismaDb.authLog.findFirst({
      where: {
        id: String(id),
        provider: "system",
        mode: "provider_post",
        email: actor.id,
      },
      select: { id: true },
    });

    if (!row) {
      return NextResponse.json(
        { ok: false, error: "Post not found" },
        { status: 404 },
      );
    }

    await prismaDb.authLog.delete({ where: { id: row.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete post";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
