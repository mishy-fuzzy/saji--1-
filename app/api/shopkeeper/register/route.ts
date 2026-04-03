import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionFromRequest } from "@/lib/server/session";

const prismaDb: any = db;

function toText(value: unknown): string {
  return String(value || "").trim();
}

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session?.userId || String(session.role || "").toLowerCase() !== "shopkeeper") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prismaDb.user.findFirst({
      where: { id: session.userId, deletedAt: null },
      select: { email: true },
    });

    if (!currentUser?.email) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const latest = await prismaDb.authLog.findFirst({
      where: {
        provider: "local",
        mode: "shopkeeper-registration",
        email: currentUser.email,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        response: true,
        notes: true,
        createdAt: true,
      },
    });

    const status = String(latest?.status || "").toLowerCase();
    const normalizedStatus =
      status === "approved" || status === "rejected" || status === "pending"
        ? status
        : "not_submitted";

    return NextResponse.json({
      ok: true,
      data: {
        registered: normalizedStatus !== "not_submitted",
        status: normalizedStatus,
        submission: latest || null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch registration status";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session?.userId || String(session.role || "").toLowerCase() !== "shopkeeper") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const payload = {
      fullName: toText(body?.fullName),
      email: toText(body?.email),
      phone: toText(body?.phone),
      shopName: toText(body?.shopName),
      shopCategory: toText(body?.shopCategory),
      shopDescription: toText(body?.shopDescription),
      county: toText(body?.county),
      town: toText(body?.town),
      streetAddress: toText(body?.streetAddress),
      buildingName: toText(body?.buildingName),
      idNumber: toText(body?.idNumber),
      kraPIN: toText(body?.kraPIN),
      idFront: toText(body?.idFront),
      idBack: toText(body?.idBack),
      businessPermit: toText(body?.businessPermit),
      shopLogo: toText(body?.shopLogo),
    };

    if (
      !payload.fullName ||
      !payload.email ||
      !payload.phone ||
      !payload.shopName ||
      !payload.shopCategory ||
      !payload.shopDescription ||
      !payload.county ||
      !payload.town ||
      !payload.streetAddress ||
      !payload.idNumber ||
      !payload.idFront ||
      !payload.idBack
    ) {
      return NextResponse.json(
        { ok: false, error: "Please complete all required registration fields" },
        { status: 400 },
      );
    }

    await prismaDb.user.update({
      where: { id: session.userId },
      data: {
        name: payload.fullName,
        email: payload.email,
        phone: payload.phone,
      },
    });

    const currentUser = await prismaDb.user.findFirst({
      where: { id: session.userId, deletedAt: null },
      select: { email: true },
    });

    if (!currentUser?.email) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const saved = await prismaDb.authLog.create({
      data: {
        provider: "local",
        mode: "shopkeeper-registration",
        email: currentUser.email,
        status: "PENDING",
        response: JSON.stringify({
          source: "shopkeeper-register",
          submittedAt: new Date().toISOString(),
          form: payload,
        }),
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        registered: true,
        status: "pending",
        submission: saved,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit shop registration";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
