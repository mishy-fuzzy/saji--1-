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

    const user = await prismaDb.user.findUnique({
      where: { id: sessionUser.userId },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    const otpMode = type === "email" ? "otp-verify-email" : "otp-verify-phone";

    const pendingOtp = await prismaDb.authLog.findFirst({
      where: {
        provider: "local",
        mode: otpMode,
        email: user.email,
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        response: true,
      },
    });

    if (!pendingOtp) {
      return NextResponse.json(
        { ok: false, error: "No verification code requested for this type" },
        { status: 400 }
      );
    }

    let otpPayload: {
      userId?: string;
      type?: string;
      code?: string;
      expiresAt?: string;
    } = {};

    try {
      otpPayload = JSON.parse(String(pendingOtp.response || "{}"));
    } catch {
      otpPayload = {};
    }

    if (String(otpPayload.userId || "") !== sessionUser.userId) {
      return NextResponse.json(
        { ok: false, error: "Verification code is not valid for this user" },
        { status: 400 }
      );
    }

    // Check if expired
    const expiresAt = new Date(String(otpPayload.expiresAt || ""));
    if (!Number.isFinite(expiresAt.getTime()) || new Date() > expiresAt) {
      await prismaDb.authLog.update({
        where: { id: pendingOtp.id },
        data: {
          status: "FAILED",
          error: "OTP expired",
        },
      });
      return NextResponse.json(
        { ok: false, error: "Verification code has expired. Request a new one" },
        { status: 400 }
      );
    }

    // Check if code matches
    if (String(otpPayload.code || "") !== code) {
      return NextResponse.json(
        { ok: false, error: "Invalid verification code" },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();

    // Update user verification status and sync provider verification queue.
    await prismaDb.$transaction(async (tx: any) => {
      const updatedUser = type === "email"
        ? await tx.user.update({
            where: { id: sessionUser.userId },
            data: { emailVerified: true },
            select: {
              id: true,
              role: true,
              email: true,
            },
          })
        : await tx.user.findUnique({
            where: { id: sessionUser.userId },
            select: {
              id: true,
              role: true,
              email: true,
            },
          });

      if (!updatedUser) {
        throw new Error("User not found during verification update");
      }

      await tx.authLog.update({
        where: { id: pendingOtp.id },
        data: {
          status: "SUCCESS",
          response: JSON.stringify({
            ...otpPayload,
            verifiedAt: nowIso,
          }),
          error: null,
        },
      });

      await tx.authLog.create({
        data: {
          provider: "local",
          mode: type === "email" ? "verified-email" : "verified-phone",
          email: updatedUser.email,
          status: "SUCCESS",
          response: JSON.stringify({
            userId: updatedUser.id,
            verifiedAt: nowIso,
          }),
        },
      });

      if (String(updatedUser.role || "").toLowerCase() === "provider") {
        const existingVerification = await tx.verification.findFirst({
          where: { userId: updatedUser.id },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            notes: true,
          },
        });

        const noteLine = `Auto-update: ${type} verified at ${nowIso}`;

        if (!existingVerification) {
          await tx.verification.create({
            data: {
              userId: updatedUser.id,
              status: "pending",
              notes: noteLine,
            },
          });
        } else {
          const mergedNotes = [
            String(existingVerification.notes || "").trim(),
            noteLine,
          ]
            .filter(Boolean)
            .join("\n");

          await tx.verification.update({
            where: { id: existingVerification.id },
            data: {
              status:
                String(existingVerification.status || "").toLowerCase() ===
                "approved"
                  ? "approved"
                  : "pending",
              notes: mergedNotes,
            },
          });
        }
      }
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
