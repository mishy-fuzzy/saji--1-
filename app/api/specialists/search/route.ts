import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { parseCoordinateLabel, resolveLocationName } from "@/lib/location";

const prismaDb: any = db;

type AuthLogRow = {
  email: string | null;
  response: string | null;
  createdAt: Date;
};

type LocationSnapshot = {
  location: string;
  latitude: number | null;
  longitude: number | null;
};

function safeText(value: unknown): string {
  return String(value || "").trim();
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function parseLocationResponse(raw: string | null): LocationSnapshot | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as {
      location?: string;
      latitude?: number;
      longitude?: number;
    };

    return {
      location: safeText(parsed?.location),
      latitude:
        typeof parsed?.latitude === "number" ? parsed.latitude : null,
      longitude:
        typeof parsed?.longitude === "number" ? parsed.longitude : null,
    };
  } catch {
    return null;
  }
}

function mapLatestByEmail(rows: AuthLogRow[]) {
  const map = new Map<string, AuthLogRow>();
  for (const row of rows) {
    const email = normalizeEmail(String(row.email || ""));
    if (!email || map.has(email)) continue;
    map.set(email, row);
  }
  return map;
}

async function getProviderLocationsByEmail(emails: string[]) {
  if (emails.length === 0) return new Map<string, LocationSnapshot>();

  const locationLogs = await prismaDb.authLog.findMany({
    where: {
      provider: "local",
      mode: "user-location",
      email: { in: emails },
      status: "SUCCESS",
    },
    orderBy: { createdAt: "desc" },
    select: { email: true, response: true, createdAt: true },
  });

  const locationByEmail = mapLatestByEmail(locationLogs);
  const resolved = new Map<string, LocationSnapshot>();

  for (const email of emails) {
    const key = normalizeEmail(email);
    const parsed = parseLocationResponse(
      locationByEmail.get(key)?.response || null,
    );

    if (parsed) {
      resolved.set(key, parsed);
    }
  }

  return resolved;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = String(searchParams.get("q") || "")
      .trim()
      .toLowerCase();
    const skill = String(searchParams.get("skill") || "all")
      .trim()
      .toLowerCase();
    const availableOnly =
      String(searchParams.get("availableOnly") || "false") === "true";

    const providers = await prismaDb.user.findMany({
      where: { role: "provider", deletedAt: null, isSuspended: false },
      select: {
        id: true,
        name: true,
        image: true,
        phone: true,
        email: true,
        createdAt: true,
        role: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const providerIds = providers.map((provider: any) => provider.id);

    const services = providerIds.length
      ? await prismaDb.service.findMany({
          where: { providerId: { in: providerIds } },
          orderBy: { createdAt: "desc" },
          take: 400,
        })
      : [];

    const providerEmails = Array.from(
      new Set(
        providers
          .map((provider: any) => String(provider?.email || "").trim())
          .filter(Boolean),
      ),
    );

    const [locationsByEmail, verificationRows] = await Promise.all([
      getProviderLocationsByEmail(providerEmails),
      providerIds.length
        ? prismaDb.verification.findMany({
            where: { userId: { in: providerIds } },
            select: { userId: true, status: true },
          })
        : Promise.resolve([]),
    ]);

    const verificationByUserId = new Map(
      (verificationRows || []).map((row: any) => [String(row.userId), row]),
    );

    const servicesByProvider = new Map<string, any[]>();
    services.forEach((service: any) => {
      const providerId = String(service.providerId || "");
      if (!providerId) return;
      const current = servicesByProvider.get(providerId) || [];
      current.push(service);
      servicesByProvider.set(providerId, current);
    });

    let specialists = await Promise.all(
      providers.map(async (provider: any, index: number) => {
        const providerId = String(provider.id || "");
        const providerServices = servicesByProvider.get(providerId) || [];
        const first = providerServices[0];
        const verification = verificationByUserId.get(providerId);

        const skills = Array.from(
          new Set(
            providerServices.map((row: any) =>
              String(row.category || "Service"),
            ),
          ),
        );

        const providerEmail = safeText(provider.email);
        const locationSnapshot = providerEmail
          ? locationsByEmail.get(normalizeEmail(providerEmail))
          : null;
        const locationLabel = safeText(locationSnapshot?.location);
        const coordsFromLabel = parseCoordinateLabel(locationLabel);
        const latitude =
          typeof locationSnapshot?.latitude === "number" &&
          Number.isFinite(locationSnapshot.latitude)
            ? locationSnapshot.latitude
            : coordsFromLabel?.latitude;
        const longitude =
          typeof locationSnapshot?.longitude === "number" &&
          Number.isFinite(locationSnapshot.longitude)
            ? locationSnapshot.longitude
            : coordsFromLabel?.longitude;
        let resolvedLocation = locationLabel;

        if (
          (!resolvedLocation || coordsFromLabel) &&
          Number.isFinite(latitude) &&
          Number.isFinite(longitude)
        ) {
          const name = await resolveLocationName(latitude, longitude);
          if (name) {
            resolvedLocation = name;
          }
        }

        const safeLatitude = Number.isFinite(latitude)
          ? (latitude as number)
          : -1.286389;
        const safeLongitude = Number.isFinite(longitude)
          ? (longitude as number)
          : 36.817223;
        const locationName = resolvedLocation || "Kenya";

        return {
          id: index + 1,
          providerId,
          name: String(provider.name || "Specialist"),
          email: String(provider.email || ""),
          verified: verification?.status === "approved",
          available: true,
          rating: 5,
          reviews: 0,
          skills,
          avatar: String(provider.image || "/placeholder.svg"),
          location: {
            lat: safeLatitude,
            lng: safeLongitude,
            name: locationName,
          },
          distance: "-",
          bio: String(first?.description || "Professional specialist"),
          phone: String(provider.phone || "Not provided"),
          hourlyRate: Number(first?.basePrice || 0),
          hiredByNeighbors: [],
          badges: verification?.status === "approved" ? ["verified"] : [],
          endorsements: [],
          completedJobs: 0,
          yearsExperience: 0,
          workSamples: providerServices.slice(0, 3).map((row: any) => ({
            type: "image",
            title: String(row.name || "Service"),
            thumbnail: String(row.image || "/placeholder.svg"),
          })),
          videos: [],
        };
      }),
    );

    if (skill !== "all") {
      specialists = specialists.filter((item) =>
        item.skills.some((entry: string) =>
          entry.toLowerCase().includes(skill),
        ),
      );
    }

    if (query) {
      specialists = specialists.filter((item) => {
        const inName = item.name.toLowerCase().includes(query);
        const inSkills = item.skills.some((entry: string) =>
          entry.toLowerCase().includes(query),
        );
        return inName || inSkills;
      });
    }

    if (availableOnly) {
      specialists = specialists.filter((item) => item.available);
    }

    return NextResponse.json({ ok: true, data: specialists });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load specialists";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
