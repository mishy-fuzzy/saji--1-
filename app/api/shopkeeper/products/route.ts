import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth";

const prismaDb: any = db;

function computeStatus(stock: number): "active" | "low_stock" | "out_of_stock" {
  if (stock <= 0) return "out_of_stock";
  if (stock <= 5) return "low_stock";
  return "active";
}

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

export async function GET(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    if (!hasAnyRole(actor, ["shopkeeper", "admin", "sub-admin", "subadmin"])) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const requestedProviderId = String(searchParams.get("providerId") || "").trim();
    const providerId = actor.role === "shopkeeper" ? actor.id : requestedProviderId || actor.id;

    const rows = await prismaDb.service.findMany({
      where: { providerId },
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    const serviceIds = rows.map((row: any) => String(row.id || "")).filter(Boolean);
    const bookingRows =
      serviceIds.length > 0
        ? await prismaDb.booking.findMany({
            where: {
              providerId,
              serviceId: { in: serviceIds },
            },
            select: { serviceId: true },
          })
        : [];

    const soldByServiceId = new Map<string, number>();
    bookingRows.forEach((row: any) => {
      const serviceId = String(row?.serviceId || "");
      if (!serviceId) return;
      soldByServiceId.set(serviceId, (soldByServiceId.get(serviceId) || 0) + 1);
    });

    const meta = await getLatestProductMeta(providerId);

    const data = rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      image: row.image || "/placeholder.svg",
      price: Number(row.basePrice || 0),
      stock: Math.max(0, Number(meta.payload.stockByServiceId[row.id] || 0)),
      sold: Number(soldByServiceId.get(String(row.id || "")) || 0),
      views: Math.max(
        0,
        Number(
          meta.payload.viewsByServiceId[row.id] || 0,
        ),
      ),
      category: row.category || "General",
      status: computeStatus(Math.max(0, Number(meta.payload.stockByServiceId[row.id] || 0))),
      description: row.description || "",
      createdAt: row.createdAt,
    }));

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load shopkeeper products";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    if (!hasAnyRole(actor, ["shopkeeper", "admin", "sub-admin", "subadmin"])) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const name = String(body?.name || "").trim();
    const category = String(body?.category || "General").trim();
    const description = String(body?.description || "");
    const providerId =
      actor.role === "shopkeeper"
        ? actor.id
        : String(body?.providerId || actor.id).trim();
    const basePrice = Number(body?.price || 0);
    const stock = Math.max(0, Math.round(Number(body?.stock || 0)));
    const views = Math.max(0, Math.round(Number(body?.views || 0)));
    const image = String(body?.image || "");

    if (!name || !providerId || basePrice <= 0) {
      return NextResponse.json(
        { ok: false, error: "name, providerId, and price are required" },
        { status: 400 },
      );
    }

    const row = await prismaDb.service.create({
      data: {
        name,
        category,
        description,
        providerId,
        basePrice: Math.max(1, Math.round(basePrice)),
        image: image || null,
      },
    });

    await upsertProductMeta(providerId, (current) => ({
      stockByServiceId: {
        ...current.stockByServiceId,
        [String(row.id)]: stock,
      },
      viewsByServiceId: {
        ...current.viewsByServiceId,
        [String(row.id)]: views,
      },
    }));

    return NextResponse.json({
      ok: true,
      data: {
        id: row.id,
        name: row.name,
        image: row.image || "/placeholder.svg",
        price: Number(row.basePrice || 0),
        stock,
        sold: 0,
        views,
        category: row.category || "General",
        status: computeStatus(stock),
        description: row.description || "",
        createdAt: row.createdAt,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create product";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
