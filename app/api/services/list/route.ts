import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

type AuthLogRow = {
  email: string | null;
  response: string | null;
  createdAt: Date;
};

function safeText(value: unknown): string {
  return String(value || "").trim();
}

function composeLocation(parts: {
  buildingName: string;
  streetAddress: string;
  town: string;
  county: string;
}): string {
  return [parts.buildingName, parts.streetAddress, parts.town, parts.county]
    .map((item) => safeText(item))
    .filter(Boolean)
    .join(", ");
}

function parseShopkeeperSettingsLocation(raw: string | null): string {
  if (!raw) return "";

  try {
    const parsed = JSON.parse(raw) as { shopLocation?: unknown };
    return safeText(parsed?.shopLocation);
  } catch {
    return "";
  }
}

function parseShopkeeperRegistrationLocation(raw: string | null): string {
  if (!raw) return "";

  try {
    const parsed = JSON.parse(raw) as {
      form?: Record<string, unknown>;
      shopLocation?: unknown;
    };
    const form = (parsed?.form || {}) as Record<string, unknown>;

    const composed = composeLocation({
      buildingName: safeText(form.buildingName),
      streetAddress: safeText(form.streetAddress),
      town: safeText(form.town),
      county: safeText(form.county),
    });

    return composed || safeText(form.shopLocation) || safeText(parsed?.shopLocation);
  } catch {
    return "";
  }
}

function parseUserLocation(raw: string | null): string {
  if (!raw) return "";

  try {
    const parsed = JSON.parse(raw) as { location?: unknown };
    return safeText(parsed?.location);
  } catch {
    return "";
  }
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
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

async function getLocationByEmail(emails: string[]) {
  if (emails.length === 0) return new Map<string, string>();

  const [settingsLogs, registrationLogs, locationLogs] = await Promise.all([
    db.authLog.findMany({
      where: {
        provider: "local",
        mode: "shopkeeper-settings",
        email: { in: emails },
      },
      orderBy: { createdAt: "desc" },
      select: { email: true, response: true, createdAt: true },
    }),
    db.authLog.findMany({
      where: {
        provider: "local",
        mode: "shopkeeper-registration",
        email: { in: emails },
      },
      orderBy: { createdAt: "desc" },
      select: { email: true, response: true, createdAt: true },
    }),
    db.authLog.findMany({
      where: {
        provider: "local",
        mode: "user-location",
        email: { in: emails },
      },
      orderBy: { createdAt: "desc" },
      select: { email: true, response: true, createdAt: true },
    }),
  ]);

  const settingsByEmail = mapLatestByEmail(settingsLogs);
  const registrationByEmail = mapLatestByEmail(registrationLogs);
  const locationByEmail = mapLatestByEmail(locationLogs);

  const resolved = new Map<string, string>();

  for (const email of emails) {
    const key = normalizeEmail(email);
    const settingsLocation = parseShopkeeperSettingsLocation(
      settingsByEmail.get(key)?.response || null,
    );

    if (settingsLocation) {
      resolved.set(key, settingsLocation);
      continue;
    }

    const registrationLocation = parseShopkeeperRegistrationLocation(
      registrationByEmail.get(key)?.response || null,
    );

    if (registrationLocation) {
      resolved.set(key, registrationLocation);
      continue;
    }

    const userLocation = parseUserLocation(
      locationByEmail.get(key)?.response || null,
    );

    if (userLocation) {
      resolved.set(key, userLocation);
    }
  }

  return resolved;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(String(searchParams.get("limit") || "100"), 10);
    const category = String(searchParams.get("category") || "").trim();

    const services = await db.service.findMany({
      where: category ? { category } : undefined,
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit || 100,
    });

    // Get booking count as proxy for reviews
    const serviceBookings = await Promise.all(
      services.map((service: any) =>
        db.booking.count({
          where: {
            serviceId: service.id,
          },
        })
      )
    );

    const providerEmails = Array.from(
      new Set(
        services
          .map((service: any) => String(service?.provider?.email || "").trim())
          .filter(Boolean),
      ),
    );

    const locationsByEmail = await getLocationByEmail(providerEmails);

    const formattedServices = services.map((service: any, index: number) => {
      const bookingCount = serviceBookings[index] || 0;
      const email = String(service?.provider?.email || "").trim();
      const location = email
        ? locationsByEmail.get(normalizeEmail(email)) || ""
        : "";

      return {
        id: service.id,
        name: service.name,
        category: service.category || "General",
        providerName: service.provider?.name || null,
        providerId: service.provider?.id || null,
        providerImage: service.provider?.image || null,
        location,
        rating: null,
        reviews: bookingCount,
        basePrice: service.basePrice || 0,
        image: service.image || null,
        description: service.description || null,
      };
    });

    return NextResponse.json({
      ok: true,
      data: formattedServices,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch services";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
