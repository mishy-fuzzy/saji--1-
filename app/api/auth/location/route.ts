import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionFromRequest } from "@/lib/server/session";
import { parseCoordinateLabel, resolveLocationName } from "@/lib/location";

type LocationPayload = {
  location?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
};

function parseLocationResponse(raw: string | null) {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as {
      location?: string;
      latitude?: number;
      longitude?: number;
      accuracy?: number;
      updatedAt?: string;
    };

    return {
      location: typeof parsed.location === "string" ? parsed.location : "",
      latitude: typeof parsed.latitude === "number" ? parsed.latitude : null,
      longitude: typeof parsed.longitude === "number" ? parsed.longitude : null,
      accuracy: typeof parsed.accuracy === "number" ? parsed.accuracy : null,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
    };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session?.userId || !session?.email) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const latest = await db.authLog.findFirst({
    where: {
      provider: "local",
      mode: "user-location",
      email: session.email,
      status: "SUCCESS",
    },
    orderBy: { createdAt: "desc" },
    select: {
      response: true,
      createdAt: true,
    },
  });

  const parsed = parseLocationResponse(latest?.response ?? null);

  return NextResponse.json({
    ok: true,
    data: {
      location: parsed?.location || "",
      latitude: parsed?.latitude ?? null,
      longitude: parsed?.longitude ?? null,
      accuracy: parsed?.accuracy ?? null,
      updatedAt: parsed?.updatedAt || latest?.createdAt || null,
    },
  });
}

export async function POST(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session?.userId || !session?.email) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: LocationPayload;

  try {
    body = (await request.json()) as LocationPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  const rawLocation = String(body.location || "").trim();
  const rawLatitude = Number(body.latitude);
  const rawLongitude = Number(body.longitude);
  const accuracy = body.accuracy === undefined ? null : Number(body.accuracy);
  const parsedCoords = parseCoordinateLabel(rawLocation);
  const latitude = Number.isFinite(rawLatitude)
    ? rawLatitude
    : parsedCoords?.latitude ?? NaN;
  const longitude = Number.isFinite(rawLongitude)
    ? rawLongitude
    : parsedCoords?.longitude ?? NaN;
  let location = rawLocation;

  if (!location && (!Number.isFinite(latitude) || !Number.isFinite(longitude))) {
    return NextResponse.json(
      { ok: false, error: "Location is required" },
      { status: 400 },
    );
  }

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return NextResponse.json(
      { ok: false, error: "Latitude must be between -90 and 90" },
      { status: 400 },
    );
  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return NextResponse.json(
      { ok: false, error: "Longitude must be between -180 and 180" },
      { status: 400 },
    );
  }

  if (accuracy !== null && (!Number.isFinite(accuracy) || accuracy < 0)) {
    return NextResponse.json(
      { ok: false, error: "Accuracy must be a positive number" },
      { status: 400 },
    );
  }

  if ((!location || parsedCoords) && Number.isFinite(latitude) && Number.isFinite(longitude)) {
    const resolvedName = await resolveLocationName(latitude, longitude);
    if (resolvedName) {
      location = resolvedName;
    } else if (!location) {
      location = `${latitude}, ${longitude}`;
    }
  }

  const responsePayload = {
    userId: session.userId,
    location,
    latitude,
    longitude,
    accuracy,
    updatedAt: new Date().toISOString(),
  };

  await db.authLog.create({
    data: {
      provider: "local",
      mode: "user-location",
      email: session.email,
      status: "SUCCESS",
      response: JSON.stringify(responsePayload),
    },
  });

  return NextResponse.json({
    ok: true,
    data: responsePayload,
  });
}
