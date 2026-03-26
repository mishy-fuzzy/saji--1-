import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"

export async function GET() {
  const jobs = await db.job.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      postedBy: { select: { id: true, name: true, email: true } },
      provider: { select: { id: true, name: true, email: true } },
      service: { select: { id: true, title: true, basePrice: true, currency: true } },
    },
  })

  return NextResponse.json({ ok: true, jobs })
}

export async function POST(request: Request) {
  const body = await request.json()

  const title = String(body?.title || "").trim()
  const description = String(body?.description || "").trim()
  const postedById = String(body?.postedById || "").trim()
  const price = Number(body?.price)

  if (!title || !description || !postedById || !Number.isFinite(price)) {
    return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 })
  }

  const job = await db.job.create({
    data: {
      title,
      description,
      postedById,
      providerId: body?.providerId ? String(body.providerId) : null,
      serviceId: body?.serviceId ? String(body.serviceId) : null,
      location: body?.location ? String(body.location) : null,
      price: Math.round(price),
      currency: String(body?.currency || "KES"),
    },
  })

  return NextResponse.json({ ok: true, job }, { status: 201 })
}
