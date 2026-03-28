import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

const prismaDb: any = db;

function computeStatus(stock: number): "active" | "low_stock" | "out_of_stock" {
  if (stock <= 0) return "out_of_stock";
  if (stock <= 5) return "low_stock";
  return "active";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = String(searchParams.get("providerId") || "").trim();

    const rows = await prismaDb.service.findMany({
      where: providerId ? { providerId } : undefined,
      include: { provider: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    const data = rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      image: row.image || "/placeholder.svg",
      price: Number(row.basePrice || 0),
      stock: 0,
      sold: 0,
      views: 0,
      category: row.category || "General",
      status: computeStatus(0),
      description: row.description || "",
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
    const body = await request.json();
    const name = String(body?.name || "").trim();
    const category = String(body?.category || "General").trim();
    const description = String(body?.description || "");
    const providerId = String(body?.providerId || "").trim();
    const basePrice = Number(body?.price || 0);
    const image = String(body?.image || "");

    if (!name || !providerId || !basePrice) {
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

    return NextResponse.json({ ok: true, data: row });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create product";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
