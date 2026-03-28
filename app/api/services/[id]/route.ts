import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionActor } from "@/lib/server/api-auth";

const prismaDb: any = db;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    const { id } = await context.params;
    const body = await request.json();

    const existing = await prismaDb.service.findFirst({
      where: { id: String(id), providerId: actor.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Service not found" },
        { status: 404 },
      );
    }

    const updated = await prismaDb.service.update({
      where: { id: String(id) },
      data: {
        name: body?.name ? String(body.name).trim() : undefined,
        description: body?.description
          ? String(body.description).trim()
          : undefined,
        category: body?.category ? String(body.category).trim() : undefined,
        basePrice:
          body?.basePrice !== undefined
            ? Math.max(0, Math.round(Number(body.basePrice) || 0))
            : undefined,
      },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update service";
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

    const existing = await prismaDb.service.findFirst({
      where: { id: String(id), providerId: actor.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Service not found" },
        { status: 404 },
      );
    }

    await prismaDb.service.delete({ where: { id: String(id) } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete service";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
