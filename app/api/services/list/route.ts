import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(String(searchParams.get("limit") || "10"), 10);
    const category = String(searchParams.get("category") || "").trim();

    const services = await db.service.findMany({
      where: category ? { category } : undefined,
      include: {
        provider: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit || 10,
    });

    // Get booking count as proxy for reviews
    const serviceBookings = await Promise.all(
      services.map((service: any) =>
        db.booking.count({
          where: {
            serviceId: service.id,
          },
        })
      )
    );

    const formattedServices = services.map((service: any, index: number) => {
      // Generate rating based on bookings (more bookings = higher rating)
      const bookingCount = serviceBookings[index] || 0;
      const avgRating = Math.min(5, 3.5 + bookingCount / 50);

      return {
        id: service.id,
        name: service.name,
        category: service.category || "General",
        providerName: service.provider?.name || "Unknown Provider",
        providerId: service.provider?.id,
        rating: parseFloat(avgRating.toFixed(1)),
        reviews: bookingCount,
        basePrice: service.basePrice || 0,
        image:
          service.image ||
          "https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=300&fit=crop",
        description: service.description || "",
      };
    });

    return NextResponse.json({
      ok: true,
      data: formattedServices,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch services";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
