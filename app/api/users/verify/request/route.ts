import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieName, verifySessionToken } from "@/lib/server/session";
import { sendVerificationEmail } from "@/lib/server/mailer";
import { db } from "@/lib/server/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(getSessionCookieName())?.value;
    const sessionUser = token ? verifySessionToken(token) : null;

    if (!sessionUser?.userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized - session expired" },
        { status: 401 }
      );
    }

    const { type } = await request.json();

    if (!type || !["email", "phone"].includes(type)) {
      return NextResponse.json(
        { ok: false, error: "Invalid verification type. Must be 'email' or 'phone'" },
        { status: 400 }
      );
    }

    const prismaDb: any = db;

    // Get user
    const user = await prismaDb.user.findUnique({
      where: { id: sessionUser.userId },
      select: { id: true, email: true, phone: true, name: true },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (type === "email" && !user.email) {
      return NextResponse.json(
        { ok: false, error: "No email on file" },
        { status: 400 }
      );
    }

    if (type === "phone" && !user.phone) {
      return NextResponse.json(
        { ok: false, error: "No phone number on file" },
        { status: 400 }
      );
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Upsert verification code (one code per type per user at a time)
    await prismaDb.verificationCode.upsert({
      where: { userId_type: { userId: sessionUser.userId, type } },
      update: { code, expiresAt },
      create: {
        userId: sessionUser.userId,
        type,
        code,
        expiresAt,
      },
    });

    // Send verification code
    if (type === "email") {
      await sendVerificationEmail(user.email, code, user.name || "User");
      console.log(`[VERIFY_REQUEST] Email verification code sent to ${user.email}`);
    } else if (type === "phone") {
      // For now, log to console (SMS integration can be added later)
      console.log(
        `[VERIFY_REQUEST] Phone verification code: ${code} (would send to ${user.phone})`
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        message: `Verification code sent to your ${type}`,
        type,
        target: type === "email" ? user.email : user.phone,
      },
    });
  } catch (error) {
    console.error("[VERIFY_REQUEST]", error);
    return NextResponse.json(
      { ok: false, error: "Failed to request verification code" },
      { status: 500 }
    );
  }
}
