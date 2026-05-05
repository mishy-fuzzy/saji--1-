import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth";

const prismaDb: any = db;

type ProductMetaPayload = {
  stockByServiceId?: Record<string, number>;
  viewsByServiceId?: Record<string, number>;
};

function parseProductMeta(raw: unknown): Required<ProductMetaPayload> {
  if (typeof raw !== "string" || !raw.trim()) {
    return { stockByServiceId: {}, viewsByServiceId: {} };
  }

  try {
    const parsed = JSON.parse(raw) as ProductMetaPayload;
    return {
      stockByServiceId:
        parsed?.stockByServiceId && typeof parsed.stockByServiceId === "object"
          ? parsed.stockByServiceId
          : {},
      viewsByServiceId:
        parsed?.viewsByServiceId && typeof parsed.viewsByServiceId === "object"
          ? parsed.viewsByServiceId
          : {},
    };
  } catch {
    return { stockByServiceId: {}, viewsByServiceId: {} };
  }
}

function computeStatus(stock: number): "active" | "low_stock" | "out_of_stock" {
  if (stock <= 0) return "out_of_stock";
  if (stock <= 5) return "low_stock";
  return "active";
}

async function getLatestProductMeta(providerId: string) {
  const latest = await prismaDb.authLog.findFirst({
    where: {
      provider: "local",
      mode: "shopkeeper-product-meta",
      email: providerId,
      status: { not: "DELETED" },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, response: true },
  });

  return {
    id: String(latest?.id || ""),
    payload: parseProductMeta(latest?.response),
    exists: Boolean(latest?.id),
  };
}

async function upsertProductMeta(
  providerId: string,
  updater: (current: Required<ProductMetaPayload>) => Required<ProductMetaPayload>,
) {
  const latest = await getLatestProductMeta(providerId);
  const nextPayload = updater(latest.payload);

  if (latest.exists) {
    await prismaDb.authLog.update({
      where: { id: latest.id },
      data: {
        status: "ACTIVE",
        response: JSON.stringify(nextPayload),
      },
    });
    return nextPayload;
  }

  await prismaDb.authLog.create({
    data: {
      provider: "local",
      mode: "shopkeeper-product-meta",
      email: providerId,
      status: "ACTIVE",
      response: JSON.stringify(nextPayload),
    },
  });

  return nextPayload;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    if (!hasAnyRole(actor, ["shopkeeper", "admin", "sub-admin", "subadmin"])) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    const existing = await prismaDb.service.findFirst({
      where:
        actor.role === "shopkeeper"
          ? { id: String(id), providerId: actor.id }
          : { id: String(id) },
      select: {
        id: true,
        providerId: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
    }

    const hasPrice = body?.price !== undefined && body?.price !== null && String(body.price).trim() !== "";
    const imageProvided = body?.image !== undefined;

    const data: Record<string, unknown> = {
      name: body?.name !== undefined ? String(body.name || "").trim() : undefined,
      category: body?.category !== undefined ? String(body.category || "").trim() : undefined,
      description: body?.description !== undefined ? String(body.description || "") : undefined,
      basePrice: hasPrice ? Math.max(1, Math.round(Number(body.price) || 0)) : undefined,
      image: imageProvided ? (String(body.image || "").trim() || null) : undefined,
    };

    const row = await prismaDb.service.update({
      where: { id: String(id) },
      data,
    });

    const hasStock = body?.stock !== undefined;
    const hasViews = body?.views !== undefined;

    if (hasStock || hasViews) {
      await upsertProductMeta(String(existing.providerId), (current) => {
        const nextStock = { ...current.stockByServiceId };
        const nextViews = { ...current.viewsByServiceId };

        if (hasStock) {
          nextStock[String(existing.id)] = Math.max(0, Math.round(Number(body?.stock || 0)));
        }

        if (hasViews) {
          nextViews[String(existing.id)] = Math.max(0, Math.round(Number(body?.views || 0)));
        }

        return {
          stockByServiceId: nextStock,
          viewsByServiceId: nextViews,
        };
      });
    }

    const [meta, bookingCount] = await Promise.all([
      getLatestProductMeta(String(existing.providerId)),
      prismaDb.booking.count({ where: { providerId: String(existing.providerId), serviceId: String(existing.id) } }),
    ]);

    const stock = Math.max(0, Number(meta.payload.stockByServiceId[String(existing.id)] || 0));
    const sold = Number(bookingCount || 0);
    const views = Math.max(0, Number(meta.payload.viewsByServiceId[String(existing.id)] || 0));

    return NextResponse.json({
      ok: true,
      data: {
        id: row.id,
        name: row.name,
        image: row.image || "/placeholder.svg",
        price: Number(row.basePrice || 0),
        stock,
        sold,
        views,
        category: row.category || "General",
        status: computeStatus(stock),
        description: row.description || "",
        createdAt: row.createdAt,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update product";
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

    if (!hasAnyRole(actor, ["shopkeeper", "admin", "sub-admin", "subadmin"])) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const existing = await prismaDb.service.findFirst({
      where:
        actor.role === "shopkeeper"
          ? { id: String(id), providerId: actor.id }
          : { id: String(id) },
      select: {
        id: true,
        providerId: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
    }

    await prismaDb.service.delete({ where: { id: String(id) } });

    await upsertProductMeta(String(existing.providerId), (current) => {
      const nextStock = { ...current.stockByServiceId };
      const nextViews = { ...current.viewsByServiceId };
      delete nextStock[String(existing.id)];
      delete nextViews[String(existing.id)];

      return {
        stockByServiceId: nextStock,
        viewsByServiceId: nextViews,
      };
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete product";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
