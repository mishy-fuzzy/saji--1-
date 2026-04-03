import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ ok: false, error: "userId is required" }, { status: 400 })
  }

  try {
    const recent = await db.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      select: {
        id: true,
        text: true,
        senderId: true,
        receiverId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    })

    const seen = new Set<string>()
    const summaries = recent
      .map((row: any) => {
        const peerId = row.senderId === userId ? row.receiverId : row.senderId
        if (!peerId || seen.has(peerId)) return null
        seen.add(peerId)
        return {
          peerId,
          lastMessage: row.text,
          updatedAt: row.createdAt,
        }
      })
      .filter(Boolean) as Array<{ peerId: string; lastMessage: string; updatedAt: Date }>

    const peerIds = summaries.map((row) => row.peerId)
    const peers = peerIds.length
      ? await db.user.findMany({
          where: { id: { in: peerIds }, deletedAt: null },
          select: { id: true, name: true, email: true, image: true, role: true },
        })
      : []

    const peerMap = new Map(peers.map((peer: any) => [peer.id, peer]))

    const threads = summaries.map((summary) => {
      const peer = peerMap.get(summary.peerId)
      return {
        peerId: summary.peerId,
        updatedAt: summary.updatedAt,
        lastMessage: summary.lastMessage,
        peer: peer
          ? {
              id: peer.id,
              name: peer.name || "User",
              email: peer.email || "",
              image: peer.image || null,
              role: peer.role || "user",
            }
          : {
              id: summary.peerId,
              name: "User",
              email: "",
              image: null,
              role: "user",
            },
      }
    })

    return NextResponse.json({ ok: true, threads })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch threads"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
