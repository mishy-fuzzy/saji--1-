import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

const prismaDb: any = db;

async function ensureStoryTable() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS "ProjectStory" (
      "id" TEXT PRIMARY KEY,
      "ownerUserId" TEXT NOT NULL,
      "ownerRole" TEXT NOT NULL,
      "ownerName" TEXT,
      "ownerAvatar" TEXT,
      "title" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "beforeImage" TEXT,
      "afterImage" TEXT,
      "thumbnail" TEXT,
      "duration" TEXT,
      "views" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "deletedAt" TIMESTAMP
    )`,
    'CREATE INDEX IF NOT EXISTS "ProjectStory_ownerUserId_idx" ON "ProjectStory" ("ownerUserId")',
    'CREATE INDEX IF NOT EXISTS "ProjectStory_createdAt_idx" ON "ProjectStory" ("createdAt")',
  ];

  for (const statement of statements) {
    await prismaDb.$executeRawUnsafe(statement);
  }
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

async function ensureLiveSessionTable() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS "LiveSession" (
      "id" TEXT PRIMARY KEY,
      "hostUserId" TEXT NOT NULL,
      "kind" TEXT NOT NULL,
      "title" TEXT,
      "category" TEXT,
      "description" TEXT,
      "thumbnail" TEXT,
      "joinFee" INTEGER,
      "viewers" INTEGER NOT NULL DEFAULT 0,
      "status" TEXT NOT NULL DEFAULT 'live',
      "startsAt" TIMESTAMP,
      "endsAt" TIMESTAMP,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "deletedAt" TIMESTAMP
    )`,
    'CREATE INDEX IF NOT EXISTS "LiveSession_hostUserId_idx" ON "LiveSession" ("hostUserId")',
    'CREATE INDEX IF NOT EXISTS "LiveSession_kind_status_idx" ON "LiveSession" ("kind", "status")',
    'CREATE INDEX IF NOT EXISTS "LiveSession_status_updatedAt_idx" ON "LiveSession" ("status", "updatedAt")',
  ];

  for (const statement of statements) {
    await prismaDb.$executeRawUnsafe(statement);
  }
}

async function ensureShopOperationalStatusTable() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS "ShopOperationalStatus" (
      "id" TEXT PRIMARY KEY,
      "shopkeeperUserId" TEXT NOT NULL,
      "isOpen" BOOLEAN NOT NULL DEFAULT false,
      "deliveryPercent" INTEGER,
      "matchedByAI" BOOLEAN NOT NULL DEFAULT false,
      "statusMessage" TEXT,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )`,
    'CREATE UNIQUE INDEX IF NOT EXISTS "ShopOperationalStatus_shopkeeperUserId_idx" ON "ShopOperationalStatus" ("shopkeeperUserId")',
    'CREATE INDEX IF NOT EXISTS "ShopOperationalStatus_isOpen_idx" ON "ShopOperationalStatus" ("isOpen")',
  ];

  for (const statement of statements) {
    await prismaDb.$executeRawUnsafe(statement);
  }
}

function toRelativeDate(value: Date): string {
  const diffMs = Date.now() - value.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return value.toLocaleDateString();
}

export async function GET() {
  try {
    await Promise.all([
      ensureStoryTable(),
      ensureCategoryMetaTable(),
      ensureLiveSessionTable(),
      ensureShopOperationalStatusTable(),
    ]);

    const [providers, shops, services, stories, categoryMetaRows, liveSessions] = await Promise.all([
      prismaDb.user.findMany({
        where: { role: "provider", deletedAt: null },
        select: { id: true, name: true, image: true },
        take: 12,
        orderBy: { createdAt: "desc" },
      }),
      prismaDb.user.findMany({
        where: { role: "shopkeeper", deletedAt: null },
        select: { id: true, name: true, image: true },
        take: 12,
        orderBy: { createdAt: "desc" },
      }),
      prismaDb.service.findMany({
        include: {
          provider: { select: { id: true, name: true, image: true } },
          _count: { select: { bookings: true } },
        },
        take: 100,
        orderBy: { createdAt: "desc" },
      }),
      prismaDb.$queryRawUnsafe(
        `SELECT
          "id",
          "ownerName",
          "ownerAvatar",
          "title",
          "type",
          "beforeImage",
          "afterImage",
          "thumbnail",
          "duration",
          "views",
          "createdAt"
        FROM "ProjectStory"
        WHERE "deletedAt" IS NULL
        ORDER BY "createdAt" DESC
        LIMIT 12`,
      ),
      prismaDb.serviceCategoryMeta.findMany({
        where: { isActive: true, deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      prismaDb.liveSession.findMany({
        where: { status: "live", deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take: 40,
      }),
    ]);

    const serviceCategoryNames = new Set(
      services
        .map((service: any) => String(service.category || "").trim())
        .filter(Boolean),
    );

    const categoryMetaByName = new Map(
      (categoryMetaRows || []).map((row: any) => [row.name, row]),
    );

    const categories: Array<{
      id: string;
      name: string;
      type: string | null;
      iconName: string | null;
      color: string | null;
    }> = [];

    for (const row of categoryMetaRows || []) {
      if (serviceCategoryNames.size && !serviceCategoryNames.has(row.name)) {
        continue;
      }
      categories.push({
        id: row.id,
        name: row.name,
        type: row.type ?? null,
        iconName: row.iconName ?? null,
        color: row.colorClass ?? null,
      });
      serviceCategoryNames.delete(row.name);
    }

    const remainingCategories = Array.from(serviceCategoryNames).sort((a, b) =>
      a.localeCompare(b),
    );

    for (const name of remainingCategories) {
      const fallbackId = name.toLowerCase().replace(/\s+/g, "-");
      const meta = categoryMetaByName.get(name);
      categories.push({
        id: meta?.id || fallbackId,
        name,
        type: meta?.type ?? null,
        iconName: meta?.iconName ?? null,
        color: meta?.colorClass ?? null,
      });
    }

    const shopIds = shops.map((shop: any) => shop.id).filter(Boolean);
    const shopStatuses = shopIds.length
      ? await prismaDb.shopOperationalStatus.findMany({
          where: { shopkeeperUserId: { in: shopIds } },
        })
      : [];
    const [shopPromotions, shopRatings] = await Promise.all([
      shopIds.length
        ? prismaDb.shopkeeperPromotion
            .findMany({
              where: {
                ownerUserId: { in: shopIds },
                deletedAt: null,
                status: "active",
                startDate: { lte: new Date() },
                endDate: { gte: new Date() },
              },
              select: { ownerUserId: true },
            })
            .catch(() => [])
        : Promise.resolve([]),
      shopIds.length
        ? prismaDb.shopkeeperReview
            .groupBy({
              by: ["shopkeeperUserId"],
              where: { shopkeeperUserId: { in: shopIds }, deletedAt: null },
              _avg: { rating: true },
              _count: { rating: true },
            })
            .catch(() => [])
        : Promise.resolve([]),
    ]);

    const statusByShop = new Map(
      (shopStatuses || []).map((status: any) => [
        status.shopkeeperUserId,
        status,
      ]),
    );

    const promotionsByOwner = new Set(
      (shopPromotions || []).map((promotion: any) => promotion.ownerUserId),
    );
    const ratingsByOwner = new Map(
      (shopRatings || []).map((entry: any) => [
        entry.shopkeeperUserId,
        {
          rating: entry._avg?.rating ?? null,
          reviews: entry._count?.rating ?? null,
        },
      ]),
    );

    const latestServiceByProvider = new Map<string, any>();
    for (const service of services) {
      if (!latestServiceByProvider.has(service.providerId)) {
        latestServiceByProvider.set(service.providerId, service);
      }
    }

    const liveHostIds = Array.from(
      new Set((liveSessions || []).map((session: any) => session.hostUserId)),
    ).filter(Boolean);
    const liveHosts = liveHostIds.length
      ? await prismaDb.user.findMany({
          where: { id: { in: liveHostIds }, deletedAt: null },
          select: { id: true, name: true, image: true },
        })
      : [];
    const liveHostMap = new Map(
      (liveHosts || []).map((host: any) => [host.id, host]),
    );

    const liveProviders = (liveSessions || [])
      .filter((session: any) => session.kind === "provider")
      .slice(0, 12)
      .map((session: any) => {
        const host = liveHostMap.get(session.hostUserId);
        return {
          id: session.id,
          name: host?.name || null,
          avatar: host?.image || null,
          host: host?.name || null,
          hostAvatar: host?.image || null,
          title: session.title || null,
          specialty: session.category || null,
          thumbnail: session.thumbnail || null,
          joinFee:
            typeof session.joinFee === "number" ? session.joinFee : null,
          viewers:
            typeof session.viewers === "number" ? session.viewers : null,
        };
      });

    const featuredShops = shops.map((shop: any) => {
      const ratingEntry = ratingsByOwner.get(shop.id);
      const statusEntry = statusByShop.get(shop.id);
      return {
        id: shop.id,
        name: shop.name || null,
        image: shop.image || null,
        rating: ratingEntry?.rating ?? null,
        reviews: ratingEntry?.reviews ?? null,
        hasSale: promotionsByOwner.has(shop.id),
        isOpen:
          typeof statusEntry?.isOpen === "boolean" ? statusEntry.isOpen : null,
        deliveryPercent:
          typeof statusEntry?.deliveryPercent === "number"
            ? statusEntry.deliveryPercent
            : null,
        matchedByAI:
          typeof statusEntry?.matchedByAI === "boolean"
            ? statusEntry.matchedByAI
            : null,
      };
    });

    const liveExperts = (liveSessions || [])
      .filter((session: any) => session.kind === "workshop")
      .slice(0, 10)
      .map((session: any) => {
        const host = liveHostMap.get(session.hostUserId);
        return {
          id: session.id,
          title: session.title || null,
          host: host?.name || null,
          hostAvatar: host?.image || null,
          specialty: session.category || null,
          viewers:
            typeof session.viewers === "number" ? session.viewers : null,
          thumbnail: session.thumbnail || null,
          description: session.description || null,
          joinFee:
            typeof session.joinFee === "number" ? session.joinFee : null,
          isFree:
            typeof session.joinFee === "number" && session.joinFee <= 0,
        };
      });

    const projectStories = (stories || []).map((story: any) => ({
      id: story.id,
      specialist: story.ownerName || null,
      avatar: story.ownerAvatar || null,
      title: story.title || null,
      type: story.type || null,
      beforeImage: story.beforeImage || null,
      afterImage: story.afterImage || null,
      thumbnail: story.thumbnail || null,
      duration: story.duration || null,
      views: Number(story.views || 0),
      timestamp: toRelativeDate(new Date(story.createdAt || Date.now())),
    }));

    const emergencyKeywords = [
      "emergency",
      "burst",
      "pipe",
      "outage",
      "leak",
      "flood",
      "urgent",
      "fire",
      "lock",
      "repair",
    ];

    const emergencyService =
      services.find((service: any) => {
        const searchable = [service.name, service.category, service.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return emergencyKeywords.some((keyword) => searchable.includes(keyword));
      }) || services[0] || null;

    const emergencyAlert =
      emergencyService?.name && emergencyService?.category
        ? {
            title: emergencyService.name,
            category: emergencyService.category,
            message: emergencyService.description?.slice(0, 80) || null,
          }
        : null;

    return NextResponse.json({
      ok: true,
      data: {
        liveProviders,
        featuredShops,
        serviceCategories: categories,
        projectStories,
        liveExperts,
        emergencyAlert,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load customer home data";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
