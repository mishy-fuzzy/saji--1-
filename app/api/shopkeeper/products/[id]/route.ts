import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

const prismaDb: any = db;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const row = await prismaDb.service.update({
      where: { id: String(id) },
      data: {
        name: body?.name,
        category: body?.category,
        description: body?.description,
        basePrice: body?.price
          ? Math.max(1, Math.round(Number(body.price)))
          : undefined,
        image: body?.image || undefined,
      },
    });

    return NextResponse.json({ ok: true, data: row });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update product";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await prismaDb.service.delete({ where: { id: String(id) } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete product";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
