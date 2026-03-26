import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"

export async function GET() {
  const disputes = await db.dispute.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      job: { select: { id: true, title: true, status: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  })

  return NextResponse.json({ ok: true, disputes })
}

export async function POST(request: Request) {
  const body = await request.json()

  const createdById = String(body?.createdById || "").trim()
  const reason = String(body?.reason || "").trim()

  if (!createdById || !reason) {
    return NextResponse.json({ ok: false, error: "createdById and reason are required" }, { status: 400 })
  }

  const dispute = await db.dispute.create({
    data: {
      createdById,
      reason,
      details: body?.details ? String(body.details) : null,
      assignedToId: body?.assignedToId ? String(body.assignedToId) : null,
      jobId: body?.jobId ? String(body.jobId) : null,
    },
  })

  return NextResponse.json({ ok: true, dispute }, { status: 201 })
}
