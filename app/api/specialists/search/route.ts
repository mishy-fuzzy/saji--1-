import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

const prismaDb: any = db;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = String(searchParams.get("q") || "")
      .trim()
      .toLowerCase();
    const skill = String(searchParams.get("skill") || "all")
      .trim()
      .toLowerCase();
    const availableOnly =
      String(searchParams.get("availableOnly") || "false") === "true";

    // Fetch verified providers with their services
    const services = await prismaDb.service.findMany({
      where: {
        provider: {
          role: "provider",
          status: "active",
        },
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            image: true,
            phone: true,
            email: true,
            createdAt: true,
            role: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    // Also fetch verification status for each provider
    const grouped = new Map<string, any[]>();
    services.forEach((service: any) => {
      const providerId = String(service.providerId || "");
      if (!providerId) return;
      const current = grouped.get(providerId) || [];
      current.push(service);
      grouped.set(providerId, current);
    });

    let specialists = await Promise.all(
      Array.from(grouped.entries()).map(
        async ([providerId, providerServices], index) => {
          const first = providerServices[0];
          const provider = first?.provider || {};
          
          // Fetch verification status
          const verification = await prismaDb.verification.findFirst({
            where: { userId: providerId },
            select: { status: true, createdAt: true },
          });

          const skills = Array.from(
            new Set(
              providerServices.map((row: any) =>
                String(row.category || "Service"),
              ),
            ),
          );

          return {
            id: index + 1,
            providerId,
            name: String(provider.name || "Specialist"),
            email: String(provider.email || ""),
            verified: verification?.status === "approved",
            available: true,
            rating: 5,
            reviews: 0,
            skills,
            avatar: String(provider.image || "/placeholder.svg"),
            location: { lat: -1.286389, lng: 36.817223, name: "Kenya" },
            distance: "-",
            bio: String(first?.description || "Professional specialist"),
            phone: String(provider.phone || "Not provided"),
            hourlyRate: Number(first?.basePrice || 0),
            hiredByNeighbors: [],
            badges: verification?.status === "approved" ? ["verified"] : [],
            endorsements: [],
            completedJobs: 0,
            yearsExperience: 0,
            workSamples: providerServices.slice(0, 3).map((row: any) => ({
              type: "image",
              title: String(row.name || "Service"),
              thumbnail: String(row.image || "/placeholder.svg"),
            })),
            videos: [],
          };
        },
      ),
    );

    if (skill !== "all") {
      specialists = specialists.filter((item) =>
        item.skills.some((entry: string) =>
          entry.toLowerCase().includes(skill),
        ),
      );
    }

    if (query) {
      specialists = specialists.filter((item) => {
        const inName = item.name.toLowerCase().includes(query);
        const inSkills = item.skills.some((entry: string) =>
          entry.toLowerCase().includes(query),
        );
        return inName || inSkills;
      });
    }

    if (availableOnly) {
      specialists = specialists.filter((item) => item.available);
    }

    return NextResponse.json({ ok: true, data: specialists });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load specialists";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
