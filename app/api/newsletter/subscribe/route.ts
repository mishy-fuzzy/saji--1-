import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();
    const name = String(body?.name || "").trim();
    const source = String(body?.source || "system-popup").trim();

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ ok: false, error: "Valid email is required" }, { status: 400 });
    }

    const existing = await db.authLog.findFirst({
      where: {
        provider: "local",
        mode: "newsletter-subscribe",
        email,
        status: "SUCCESS",
      },
      select: { id: true },
    });

    if (!existing) {
      await db.authLog.create({
        data: {
          provider: "local",
          mode: "newsletter-subscribe",
          email,
          status: "SUCCESS",
          response: JSON.stringify({ name, source, subscribedAt: new Date().toISOString() }),
        },
      });
    }

    return NextResponse.json({ ok: true, data: { subscribed: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to subscribe";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
