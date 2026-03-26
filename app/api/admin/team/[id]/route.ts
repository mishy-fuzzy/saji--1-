import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  await db.user.delete({
    where: { id },
  })

  return NextResponse.json({ ok: true })
}
