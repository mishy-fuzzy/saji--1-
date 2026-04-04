import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth"

type PatchBody = {
  status?: "pending" | "approved" | "rejected"
  notes?: string
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { actor, error } = await getSessionActor(request)
  if (error) return error
  if (!actor || !hasAnyRole(actor, ["admin", "sub-admin", "subadmin"])) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
  }

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
