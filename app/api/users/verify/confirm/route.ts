import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieName, verifySessionToken } from "@/lib/server/session";
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

    const { type, code } = await request.json();

    if (!type || !["email", "phone"].includes(type)) {
      return NextResponse.json(
        { ok: false, error: "Invalid verification type. Must be 'email' or 'phone'" },
        { status: 400 }
      );
    }

    if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
      return NextResponse.json(
        { ok: false, error: "Invalid code format. Must be 6 digits" },
        { status: 400 }
      );
    }

    const prismaDb: any = db;

    // Find verification code
    const verificationCode = await prismaDb.verificationCode.findUnique({
      where: { userId_type: { userId: sessionUser.userId, type } },
    });

    if (!verificationCode) {
      return NextResponse.json(
        { ok: false, error: "No verification code requested for this type" },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date() > verificationCode.expiresAt) {
      await prismaDb.verificationCode.delete({
        where: { id: verificationCode.id },
      });
      return NextResponse.json(
        { ok: false, error: "Verification code has expired. Request a new one" },
        { status: 400 }
      );
    }

    // Check if code matches
    if (verificationCode.code !== code) {
      return NextResponse.json(
        { ok: false, error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Update user verification status
    const updateData =
      type === "email"
        ? { emailVerified: true }
        : { phoneVerified: true };

    await prismaDb.user.update({
      where: { id: sessionUser.userId },
      data: updateData,
    });

    // Delete used verification code
    await prismaDb.verificationCode.delete({
      where: { id: verificationCode.id },
    });

    console.log(
      `[VERIFY_CONFIRM] User ${sessionUser.userId} verified ${type}`
    );

    return NextResponse.json({
      ok: true,
      data: {
        message: `${type} successfully verified!`,
        type,
        verified: true,
      },
    });
  } catch (error) {
    console.error("[VERIFY_CONFIRM]", error);
    return NextResponse.json(
      { ok: false, error: "Failed to verify code" },
      { status: 500 }
    );
  }
}
