import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ ok: false, error: "userId is required" }, { status: 400 })
  }

  const threads = await db.messageThread.findMany({
    where: {
      members: {
        some: { userId },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          sender: {
            select: { id: true, name: true },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  })

  return NextResponse.json({ ok: true, threads })
}
