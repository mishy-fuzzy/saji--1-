import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/server/db"

const prismaDb: any = db

export async function GET(req: NextRequest) {
  try {
    const emergencyKeywords = [
      "emergency",
      "urgent",
      "burst",
      "pipe",
      "outage",
      "leak",
      "flood",
      "lock",
      "repair",
      "fire",
    ]

    const services = await prismaDb.service.findMany({
      where: {
        OR: [
          { name: { contains: "emergency", mode: "insensitive" } },
          { description: { contains: "emergency", mode: "insensitive" } },
          { category: { contains: "emergency", mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        basePrice: true,
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    })

    const fallbackServices =
      services.length > 0
        ? services
        : await prismaDb.service.findMany({
            select: {
              id: true,
              name: true,
              description: true,
              category: true,
              basePrice: true,
            },
            orderBy: { createdAt: "desc" },
            take: 100,
          })

    const matchedEmergencyServices = fallbackServices
      .filter((service: any) => {
        const text = [service.name, service.category, service.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        return emergencyKeywords.some((keyword) => text.includes(keyword))
      })
      .slice(0, 12)

    const emergencyServices =
      (matchedEmergencyServices.length > 0
        ? matchedEmergencyServices
        : fallbackServices.slice(0, 12))
      .map((service: any) => ({
        id: String(service.id),
        label: String(service.name || "Emergency Service"),
        price: Number(service.basePrice || 0),
        description: String(service.description || service.category || "Urgent support"),
      }))

    return NextResponse.json({
      ok: true,
      data: emergencyServices,
    })
  } catch (error) {
    console.error("Emergency services error:", error)
    return NextResponse.json(
      { ok: false, error: "Failed to fetch emergency services" },
      { status: 500 }
    )
  }
}
