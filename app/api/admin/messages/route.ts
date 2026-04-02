import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionFromRequest } from "@/lib/server/session";

const prismaDb: any = db;

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session?.userId || session?.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Fetch all messages where admin is the receiver
    const messages = await prismaDb.message.findMany({
      where: {
        receiverId: session.userId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Limit to last 50 messages
    });

    // Group messages by sender to create conversation summaries
    const summaries = new Map();
    messages.forEach((msg: any) => {
      if (!summaries.has(msg.senderId)) {
        summaries.set(msg.senderId, {
          id: msg.id,
          from: msg.sender.name || msg.sender.email,
          senderId: msg.senderId,
          message: msg.text,
          time: formatTime(msg.createdAt),
          unread: false, // Could track this in a separate Unread model
          replies: 0, // Could track this in a separate Reply model
          category: "Messages",
        });
      }
    });

    const messagesList = Array.from(summaries.values());

    return NextResponse.json({
      ok: true,
      data: messagesList,
      count: messagesList.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch messages";
    console.error("[ADMIN_MESSAGES_API]", error);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}

function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;

  return new Date(date).toLocaleDateString();
}
