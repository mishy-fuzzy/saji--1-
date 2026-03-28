import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

const prismaDb: any = db;

export async function GET() {
  try {
    const [providers, shops, services] = await Promise.all([
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
        },
        take: 40,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const categories = Array.from(
      new Set(
        services.map((service: any) => String(service.category || "General")),
      ),
    ).map((name, index) => ({ id: index + 1, name }));

    const liveProviders = providers.map((provider: any) => ({
      id: provider.id,
      name: provider.name || "Provider",
      avatar: provider.image || "/placeholder.svg",
      specialty: "Service Provider",
    }));

    const featuredShops = shops.map((shop: any) => ({
      id: shop.id,
      name: shop.name || "Shop",
      image: shop.image || "/placeholder.svg",
      rating: 5,
      reviews: 0,
      deliveryPercent: "100%",
      isOpen: true,
      hasSale: false,
      isLive: false,
      matchedByAI: false,
    }));

    const liveExperts = services.slice(0, 10).map((service: any) => ({
      id: service.id,
      title: service.name,
      host: service.provider?.name || "Provider",
      hostAvatar: service.provider?.image || "/placeholder.svg",
      specialty: service.category || "Service",
      viewers: 0,
      thumbnail: service.image || "/placeholder.svg",
      description: service.description || "",
      isFree: true,
      badge: "Live",
    }));

    const projectStories = services
      .slice(0, 12)
      .map((service: any, index: number) => ({
        id: service.id,
        specialist: service.provider?.name || "Provider",
        avatar: service.provider?.image || "/placeholder.svg",
        title: service.name,
        type: index % 2 === 0 ? "before-after" : "timelapse",
        beforeImage: service.image || "/placeholder.svg",
        afterImage: service.image || "/placeholder.svg",
        thumbnail: service.image || "/placeholder.svg",
        duration: "15s",
        views: Number(service.bookingCount || 0),
        timestamp: "Now",
      }));

    return NextResponse.json({
      ok: true,
      data: {
        liveProviders,
        featuredShops,
        serviceCategories: categories,
        projectStories,
        liveExperts,
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
