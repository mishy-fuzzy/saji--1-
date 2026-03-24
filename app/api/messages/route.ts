import { NextResponse } from "next/server"
import { db } from "@/lib/server/db"
import { getSessionActor } from "@/lib/server/api-auth"
import { createInAppNotification } from "@/lib/server/in-app-notifications"

const prismaDb: any = db

function toPositiveInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(String(value || ""), 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return parsed
}

export async function GET(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request)
    if (error || !actor) return error

    const { searchParams } = new URL(request.url)
    const withUserId = String(searchParams.get("withUserId") || "").trim()
    const limit = toPositiveInt(searchParams.get("limit"), 100)

    if (withUserId) {
      const messages = await prismaDb.message.findMany({
        where: {
          OR: [
            { senderId: actor.id, receiverId: withUserId },
            { senderId: withUserId, receiverId: actor.id },
          ],
        },
        select: {
          id: true,
          text: true,
          senderId: true,
          receiverId: true,
          createdAt: true,
          sender: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
        take: Math.min(limit, 500),
      })

      return NextResponse.json({ ok: true, data: messages })
    }

    const latest = await prismaDb.message.findMany({
      where: {
        OR: [{ senderId: actor.id }, { receiverId: actor.id }],
      },
      select: {
        id: true,
        text: true,
        senderId: true,
        receiverId: true,
        createdAt: true,
        sender: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    })

    const unreadRows = await prismaDb.message.findMany({
      where: {
        receiverId: actor.id,
      },
      select: {
        senderId: true,
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    })

    const unreadCountByPeer = unreadRows.reduce((acc: Record<string, number>, row: { senderId: string }) => {
      const key = String(row.senderId || "")
      if (!key) return acc
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    const seen = new Set<string>()
    const rawConversations = latest
      .map((row: any) => {
        const peerId = row.senderId === actor.id ? row.receiverId : row.senderId
        if (!peerId || seen.has(peerId)) return null
        seen.add(peerId)
        return {
          peerId,
          lastMessage: row.text,
          createdAt: row.createdAt,
          unread: unreadCountByPeer[peerId] || 0,
        }
      })
      .filter(Boolean) as Array<{ peerId: string; lastMessage: string; createdAt: string; unread: number }>

    const peerIds = rawConversations.map((item) => item.peerId)
    const peers = peerIds.length
      ? await prismaDb.user.findMany({
          where: {
            id: { in: peerIds },
            deletedAt: null,
          },
          select: {
            id: true,
            name: true,
            role: true,
          },
        })
      : []

    const peerMap = new Map(peers.map((peer: { id: string; name: string | null; role: string }) => [peer.id, peer]))

    const conversations = rawConversations.map((item) => {
      const peer = peerMap.get(item.peerId)
      return {
        ...item,
        peer: peer
          ? {
              id: peer.id,
              name: peer.name || "User",
              role: String(peer.role || "user"),
            }
          : {
              id: item.peerId,
              name: "User",
              role: "user",
            },
      }
    })

    return NextResponse.json({ ok: true, data: conversations })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch messages"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request)
    if (error || !actor) return error

    const body = await request.json()
    const receiverId = String(body?.receiverId || "").trim()
    const text = String(body?.text || "").trim()

    if (!receiverId) {
      return NextResponse.json({ ok: false, error: "receiverId is required" }, { status: 400 })
    }

    if (!text) {
      return NextResponse.json({ ok: false, error: "text is required" }, { status: 400 })
    }

    if (receiverId === actor.id) {
      return NextResponse.json({ ok: false, error: "Cannot message yourself" }, { status: 400 })
    }

    const receiver = await prismaDb.user.findFirst({
      where: { id: receiverId, deletedAt: null },
      select: { id: true, name: true, role: true },
    })

    if (!receiver) {
      return NextResponse.json({ ok: false, error: "Receiver not found" }, { status: 404 })
    }

    const row = await prismaDb.message.create({
      data: {
        senderId: actor.id,
        receiverId,
        text,
      },
      select: {
        id: true,
        text: true,
        senderId: true,
        receiverId: true,
        createdAt: true,
      },
    })

    await createInAppNotification({
      userId: receiverId,
      type: "message",
      title: `New message from ${actor.name}`,
      message: text.length > 96 ? `${text.slice(0, 93)}...` : text,
      actionHref: "/customer/messages",
      metadata: { senderId: actor.id, messageId: row.id },
    })

    return NextResponse.json({ ok: true, data: row })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send message"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
