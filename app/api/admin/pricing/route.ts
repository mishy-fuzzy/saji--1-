import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth";

const prismaDb: any = db;

function mapService(row: any) {
  return {
    id: String(row.id),
    name: String(row.name || ""),
    category: String(row.category || "General"),
    basePrice: Number(row.basePrice || 0),
    commission: 10,
    tier: "Standard",
    status:
      row.provider?.deletedAt || row.provider?.isSuspended
        ? "Inactive"
        : "Active",
    providerName: row.provider?.name ? String(row.provider.name) : "Provider",
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

function toSafeInt(value: unknown, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

function toSafeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

export async function GET(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    if (!hasAnyRole(actor, ["admin"])) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = String(searchParams.get("status") || "All").trim();
    const query = String(searchParams.get("q") || "")
      .trim()
      .toLowerCase();

    const rows = await prismaDb.service.findMany({
      include: {
        provider: {
          select: {
            name: true,
            isSuspended: true,
            deletedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const mapped = rows.map(mapService);
    const filtered = mapped.filter((row: any) => {
      const matchesStatus = status === "All" || row.status === status;
      const haystack =
        `${row.name} ${row.category} ${row.providerName}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      return matchesStatus && matchesQuery;
    });

    return NextResponse.json({ ok: true, data: filtered });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load pricing services";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    if (!hasAnyRole(actor, ["admin"])) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const name = String(body?.name || "").trim();
    const category = String(body?.category || "General").trim() || "General";
    const basePrice = Math.max(1, toSafeInt(body?.basePrice, 0));
    const commission = Math.max(
      0,
      Math.min(100, toSafeNumber(body?.commission, 10)),
    );

    if (!name || !basePrice) {
      return NextResponse.json(
        { ok: false, error: "name and basePrice are required" },
        { status: 400 },
      );
    }

    const fallbackProvider = await prismaDb.user.findFirst({
      where: {
        deletedAt: null,
        role: { in: ["provider", "shopkeeper"] },
      },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    if (!fallbackProvider?.id) {
      return NextResponse.json(
        {
          ok: false,
          error: "No provider/shopkeeper account found to attach new service",
        },
        { status: 400 },
      );
    }

    const row = await prismaDb.service.create({
      data: {
        name,
        category,
        description: String(body?.description || `Service: ${name}`).trim(),
        basePrice,
        providerId: fallbackProvider.id,
      },
      include: {
        provider: {
          select: {
            name: true,
            isSuspended: true,
            deletedAt: true,
          },
        },
      },
    });

    await prismaDb.authLog.create({
      data: {
        provider: "system",
        mode: "admin-pricing-create",
        email: actor.email,
        status: "SUCCESS",
        response: JSON.stringify({ serviceId: row.id, commission }),
      },
    });

    return NextResponse.json({ ok: true, data: mapService(row) });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create pricing service";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    if (!hasAnyRole(actor, ["admin"])) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const id = String(body?.id || "").trim();
    const basePrice = Math.max(1, toSafeInt(body?.basePrice, 0));
    const commission = Math.max(
      0,
      Math.min(100, toSafeNumber(body?.commission, 10)),
    );

    if (!id || !basePrice) {
      return NextResponse.json(
        { ok: false, error: "id and basePrice are required" },
        { status: 400 },
      );
    }

    const row = await prismaDb.service.update({
      where: { id },
      data: {
        basePrice,
        name: body?.name ? String(body.name).trim() : undefined,
        category: body?.category ? String(body.category).trim() : undefined,
      },
      include: {
        provider: {
          select: {
            name: true,
            isSuspended: true,
            deletedAt: true,
          },
        },
      },
    });

    await prismaDb.authLog.create({
      data: {
        provider: "system",
        mode: "admin-pricing-update",
        email: actor.email,
        status: "SUCCESS",
        response: JSON.stringify({ serviceId: row.id, commission }),
      },
    });

    return NextResponse.json({ ok: true, data: mapService(row) });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update pricing service";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    if (!hasAnyRole(actor, ["admin"])) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const id = String(searchParams.get("id") || "").trim();

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "id is required" },
        { status: 400 },
      );
    }

    await prismaDb.service.delete({ where: { id } });

    await prismaDb.authLog.create({
      data: {
        provider: "system",
        mode: "admin-pricing-delete",
        email: actor.email,
        status: "SUCCESS",
        response: JSON.stringify({ serviceId: id }),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to delete pricing service";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
