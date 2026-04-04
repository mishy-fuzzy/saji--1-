import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieName, verifySessionToken } from "@/lib/server/session";
import { sendVerificationEmail } from "@/lib/server/mailer";
import { db } from "@/lib/server/db";

export const runtime = "nodejs";

function isLocalhostRequest(request: NextRequest): boolean {
  const host = String(
    request.headers.get("x-forwarded-host") || request.headers.get("host") || ""
  ).toLowerCase();

  return host.includes("localhost") || host.includes("127.0.0.1") || host.includes("::1");
}

export async function POST(request: NextRequest) {
  try {
    const allowLocalFallback =
      process.env.NODE_ENV !== "production" ||
      isLocalhostRequest(request) ||
      String(process.env.ALLOW_LOCAL_VERIFY_FALLBACK || "").toLowerCase() === "true";

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

    if (type === "phone" && !user.phone && !allowLocalFallback) {
      return NextResponse.json(
        { ok: false, error: "No phone number on file" },
        { status: 400 }
      );
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const otpMode = type === "email" ? "otp-verify-email" : "otp-verify-phone";

    // Store OTP in AuthLog because this schema does not include VerificationCode model.
    await prismaDb.authLog.create({
      data: {
        provider: "local",
        mode: otpMode,
        email: user.email,
        status: "PENDING",
        response: JSON.stringify({
          userId: sessionUser.userId,
          type,
          code,
          expiresAt: expiresAt.toISOString(),
        }),
      },
    });

    let deliveryMode: "sent" | "fallback" = "sent";

    // Send verification code
    if (type === "email") {
      try {
        await sendVerificationEmail(user.email, code, user.name || "User");
        console.log(`[VERIFY_REQUEST] Email verification code sent to ${user.email}`);
      } catch (mailError) {
        if (!allowLocalFallback) {
          throw mailError;
        }

        deliveryMode = "fallback";
        const message =
          mailError instanceof Error ? mailError.message : "Email delivery failed";
        console.warn(`[VERIFY_REQUEST] Email delivery fallback: ${message}`);
        console.warn(`[VERIFY_REQUEST] OTP for ${user.email}: ${code}`);
      }
    } else if (type === "phone") {
      if (!user.phone) {
        deliveryMode = "fallback";
      }

      // For now, log to console (SMS integration can be added later)
      console.log(
        `[VERIFY_REQUEST] Phone verification code: ${code} (would send to ${user.phone || "no-phone-on-file"})`
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        message:
          deliveryMode === "sent"
            ? `Verification code sent to your ${type}`
            : type === "email"
              ? `Email service is not configured locally. Use the OTP from server logs.`
              : `Phone SMS is not configured locally (or phone is missing). Use the OTP from server logs.`,
        type,
        target: type === "email" ? user.email : user.phone || "",
        ...(deliveryMode === "fallback" ? { devCode: code } : {}),
      },
    });
  } catch (error) {
    console.error("[VERIFY_REQUEST]", error);
    const errorMessage =
      error instanceof Error && process.env.NODE_ENV !== "production"
        ? error.message
        : "Failed to request verification code";
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}
