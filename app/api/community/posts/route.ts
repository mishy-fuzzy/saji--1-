import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

const prismaDb: any = db;

export async function GET() {
  try {
    const [services, users] = await Promise.all([
      prismaDb.service.findMany({
        include: {
          provider: { select: { id: true, name: true, image: true } },
        },
        take: 30,
        orderBy: { createdAt: "desc" },
      }),
      prismaDb.user.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true, image: true, role: true },
        take: 20,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const posts = services.map((service: any, index: number) => ({
      id: index + 1,
      author: {
        id: service.provider?.id || `provider-${index + 1}`,
        name: service.provider?.name || "Provider",
        avatar: service.provider?.image || "/placeholder.svg",
        verified: true,
        role: service.category || "Specialist",
        followers: 0,
      },
      content: service.description || service.name,
      images: service.image ? [service.image] : [],
      likes: 0,
      comments: 0,
      shares: 0,
      timestamp: new Date(service.createdAt).toLocaleDateString(),
      location: "Kenya",
    }));

    const trendingCategories = Array.from(
      new Set(
        services.map((service: any) => String(service.category || "general")),
      ),
    ) as string[];

    const trendingTopics = trendingCategories
      .slice(0, 8)
      .map((category: string) => ({
        tag: `#${category.replace(/\s+/g, "")}`,
        posts: services.filter(
          (service: any) => String(service.category) === category,
        ).length,
        growth: "+0%",
      }));

    const groupCategories = Array.from(
      new Set(
        services.map((service: any) => String(service.category || "General")),
      ),
    ) as string[];

    const suggestedGroups = groupCategories
      .slice(0, 6)
      .map((name: string, index: number) => ({
        id: index + 1,
        name: `${name} Community`,
        members: services.filter(
          (service: any) => String(service.category || "General") === name,
        ).length,
        image:
          services.find(
            (service: any) => String(service.category || "General") === name,
          )?.image || "/placeholder.svg",
        description: `${name} discussions and updates`,
      }));

    const suggestedUsers = users
      .slice(0, 8)
      .map((user: any, index: number) => ({
        id: index + 1,
        name: user.name || "User",
        avatar: user.image || "/placeholder.svg",
        role: String(user.role || "member"),
        followers: 0,
      }));

    return NextResponse.json({
      ok: true,
      data: {
        posts,
        trendingTopics,
        suggestedGroups,
        suggestedUsers,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load community feed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
