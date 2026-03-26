import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"

type PatchBody = {
  status?: "pending" | "approved" | "rejected"
  notes?: string
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const body = (await request.json()) as PatchBody

  if (!body.status && typeof body.notes !== "string") {
    return NextResponse.json({ ok: false, error: "No update payload provided" }, { status: 400 })
  }

  const updated = await db.verification.update({
    where: { id },
    data: {
      status: body.status,
      notes: typeof body.notes === "string" ? body.notes : undefined,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  })

  return NextResponse.json({ ok: true, verification: updated })
}
