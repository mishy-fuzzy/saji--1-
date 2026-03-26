import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"

export async function GET() {
  const services = await db.service.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      provider: {
        select: { id: true, name: true, email: true, avatar: true },
      },
      category: {
        select: { id: true, name: true, slug: true },
      },
    },
  })

  return NextResponse.json({ ok: true, services })
}

export async function POST(request: Request) {
  const body = await request.json()

  const title = String(body?.title || "").trim()
  const description = String(body?.description || "").trim()
  const providerId = String(body?.providerId || "").trim()
  const basePrice = Number(body?.basePrice)

  if (!title || !description || !providerId || !Number.isFinite(basePrice)) {
    return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 })
  }

  const created = await db.service.create({
    data: {
      title,
      description,
      providerId,
      basePrice: Math.round(basePrice),
      currency: String(body?.currency || "KES"),
      categoryId: body?.categoryId ? String(body.categoryId) : null,
    },
  })

  return NextResponse.json({ ok: true, service: created }, { status: 201 })
}
