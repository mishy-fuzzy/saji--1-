import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

const ALLOWED_ROLES = new Set(["customer", "provider", "shopkeeper"]);

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const referrerId = String(body?.referrerId || "").trim();
    const referralCode = String(body?.referralCode || "").trim();
    const role = String(body?.role || "").trim().toLowerCase();

    if (!referrerId) {
      return NextResponse.json({ ok: false, error: "referrerId is required" }, { status: 400 });
    }

    const responsePayload = {
      referrerId,
      referralCode,
      role: ALLOWED_ROLES.has(role) ? role : "unknown",
      openedAt: new Date().toISOString(),
      userAgent: request.headers.get("user-agent") || "",
    };

    await db.authLog.create({
      data: {
        provider: "local",
        mode: "referral-open",
        status: "SUCCESS",
        response: JSON.stringify(responsePayload),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to track referral open";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
