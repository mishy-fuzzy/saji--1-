import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
const prismaDb: any = db

export async function GET() {
  try {
    const services = await prismaDb.service.findMany({
      include: {
        provider: {
          select: {
            name: true,
            image: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })
    return NextResponse.json({ ok: true, data: services })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch services"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, category, basePrice, providerId } = body

    const service = await prismaDb.service.create({
      data: {
        name,
        description,
        category,
        basePrice,
        providerId
      }
    })

    return NextResponse.json({ ok: true, data: service })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create service"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
