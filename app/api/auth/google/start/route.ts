import { NextResponse } from "next/server";
import {
  buildGoogleAuthUrl,
  resolveGoogleRedirectUri,
} from "@/lib/server/google-oauth";
import { db, serializePayload } from "@/lib/server/db";

function normalizeMode(mode: string | null): "login" | "signup" {
  return mode === "signup" ? "signup" : "login";
}

function normalizeSignupRole(
  role: string | null,
): "customer" | "provider" | "shopkeeper" {
  const normalized = String(role || "customer")
    .trim()
    .toLowerCase();
  if (normalized === "provider") return "provider";
  if (normalized === "shopkeeper") return "shopkeeper";
  return "customer";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = normalizeMode(searchParams.get("mode"));
    const role = normalizeSignupRole(searchParams.get("role"));
    const state = Buffer.from(
      JSON.stringify({ mode, role, ts: Date.now() }),
    ).toString("base64url");
    const redirectUri = resolveGoogleRedirectUri();

    const authUrl = buildGoogleAuthUrl(state);

    try {
      await db.authLog.create({
        data: {
          provider: "google",
          mode,
          status: "STARTED",
          response: serializePayload({ role, state, redirectUri }),
        },
      });
    } catch {
      // OAuth start should continue even when audit logging is unavailable.
    }

    return NextResponse.redirect(authUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Google OAuth start failed";
    const { searchParams, origin } = new URL(request.url);
    const mode = normalizeMode(searchParams.get("mode"));
    const isDbConnectivityIssue =
      message.toLowerCase().includes("can't reach database") ||
      message.toLowerCase().includes("database server") ||
      message.toLowerCase().includes("prisma");

    const friendlyMessage =
      message.includes("GOOGLE_CLIENT_ID") ||
      message.includes("GOOGLE_CLIENT_SECRET") ||
      message.includes("GOOGLE_REDIRECT_URI")
        ? "Google sign-in is not configured yet. Please use email/password login."
        : message.includes("redirect_uri")
          ? "Google sign-in redirect URI mismatch. Verify GOOGLE_REDIRECT_URI in your environment and Google Console."
          : isDbConnectivityIssue
            ? "Google sign-in is temporarily unavailable. Please check your database connection and try again."
            : message;

    try {
      await db.authLog.create({
        data: {
          provider: "google",
          mode,
          status: "FAILED",
          error: message,
        },
      });
    } catch {
      // Keep API response behavior stable when DB logging fails.
    }

    return NextResponse.redirect(
      `${origin}/auth/${mode}?error=${encodeURIComponent(friendlyMessage)}`,
    );
  }
}
