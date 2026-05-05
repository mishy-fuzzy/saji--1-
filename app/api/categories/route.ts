import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth";

const prismaDb: any = db;

function safeText(value: unknown): string {
  return String(value || "").trim();
}

async function ensureCategoryMetaTable() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS "ServiceCategoryMeta" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "type" TEXT,
      "iconName" TEXT,
      "colorClass" TEXT,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "deletedAt" TIMESTAMP
    )`,
    'CREATE UNIQUE INDEX IF NOT EXISTS "ServiceCategoryMeta_name_idx" ON "ServiceCategoryMeta" ("name")',
    'CREATE INDEX IF NOT EXISTS "ServiceCategoryMeta_isActive_idx" ON "ServiceCategoryMeta" ("isActive", "deletedAt")',
  ];

  for (const statement of statements) {
    await prismaDb.$executeRawUnsafe(statement);
  }
}

export async function GET() {
  try {
    await ensureCategoryMetaTable();

    const categories = await prismaDb.serviceCategoryMeta.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ ok: true, data: categories });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load categories";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    if (!hasAnyRole(actor, ["admin", "sub-admin", "subadmin"])) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    await ensureCategoryMetaTable();

    const body = await request.json().catch(() => ({}));
    const name = safeText(body?.name);
    const type = safeText(body?.type) || null;
    const iconName = safeText(body?.iconName) || null;
    const colorClass = safeText(body?.colorClass) || null;
    const sortOrder = Number.isFinite(body?.sortOrder)
      ? Number(body.sortOrder)
      : 0;
    const isActive =
      body?.isActive === undefined ? true : Boolean(body.isActive);

    if (!name) {
      return NextResponse.json(
        { ok: false, error: "name is required" },
        { status: 400 },
      );
    }

    const existing = await prismaDb.serviceCategoryMeta.findFirst({
      where: { name },
    });

    const record = existing
      ? await prismaDb.serviceCategoryMeta.update({
          where: { id: existing.id },
          data: {
            type,
            iconName,
            colorClass,
            sortOrder,
            isActive,
            deletedAt: isActive ? null : new Date(),
          },
        })
      : await prismaDb.serviceCategoryMeta.create({
          data: {
            name,
            type,
            iconName,
            colorClass,
            sortOrder,
            isActive,
          },
        });

    return NextResponse.json({ ok: true, data: record });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save category";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
