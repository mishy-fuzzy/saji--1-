import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { hashPassword } from "@/lib/server/password";
import { createSessionCookie } from "@/lib/server/session";

const prismaDb: any = db;

function normalizePhone(value: string): string {
  return String(value || "").replace(/\D/g, "");
}

async function ensureRoleProfile(tx: any, role: string, userId: string) {
  if (role === "customer") {
    await tx.customer.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
    return;
  }

  if (role === "provider") {
    await tx.serviceProvider.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
    return;
  }

  if (role === "agent") {
    await tx.agent.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
    return;
  }

  if (role === "secretary") {
    await tx.secretary.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email || "")
      .trim()
      .toLowerCase();
    const phone = String(body?.phone || "").trim();
    const name = String(body?.name || "").trim();
    const password = String(body?.password || "");

    if (!email || !phone || !password) {
      return NextResponse.json(
        { ok: false, error: "email, phone and password are required" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { ok: false, error: "password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const user = await prismaDb.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        deletedAt: true,
        isSuspended: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "No account found for this email" },
        { status: 404 },
      );
    }

    if (!user.deletedAt) {
      return NextResponse.json(
        { ok: false, error: "Account is already active. Please log in." },
        { status: 409 },
      );
    }

    const storedPhone = normalizePhone(String(user.phone || ""));
    const providedPhone = normalizePhone(phone);
    if (!storedPhone || storedPhone !== providedPhone) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Phone number does not match this account. Please use the original signup phone.",
        },
        { status: 403 },
      );
    }

    const passwordHash = hashPassword(password);

    const restored = await prismaDb.$transaction(async (tx: any) => {
      const updated = await tx.user.update({
        where: { id: user.id },
        data: {
          deletedAt: null,
          isSuspended: false,
          passwordHash,
          ...(name ? { name } : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      });

      await ensureRoleProfile(tx, String(updated.role || ""), updated.id);

      await tx.authLog.create({
        data: {
          provider: "local",
          mode: "reactivate",
          email: updated.email,
          status: "SUCCESS",
          response: JSON.stringify({ role: updated.role }),
        },
      });

      return updated;
    });

    const response = NextResponse.json({ ok: true, data: restored });
    response.headers.append(
      "Set-Cookie",
      createSessionCookie({
        userId: restored.id,
        role: restored.role,
        email: restored.email,
      }),
    );

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Account reactivation failed";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
