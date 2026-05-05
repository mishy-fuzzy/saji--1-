import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

const prismaDb: any = db;

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
    prismaDb.authLog.findMany({
      where: {
        provider: "local",
        mode: "shopkeeper-settings",
        email: { in: emails },
      },
      orderBy: { createdAt: "desc" },
      select: { email: true, response: true, createdAt: true },
    }),
    prismaDb.authLog.findMany({
      where: {
        provider: "local",
        mode: "shopkeeper-registration",
        email: { in: emails },
      },
      orderBy: { createdAt: "desc" },
      select: { email: true, response: true, createdAt: true },
    }),
    prismaDb.authLog.findMany({
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

async function getCommentCounts(serviceIds: string[]) {
  const counts = new Map<string, number>();
  if (serviceIds.length === 0) return counts;

  const rows = await prismaDb.authLog.findMany({
    where: {
      provider: "community",
      mode: "comment",
      email: { in: serviceIds },
      status: { not: "DELETED" },
    },
    select: { email: true },
  });

  rows.forEach((row: { email: string | null }) => {
    const key = String(row.email || "").trim();
    if (!key) return;
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return counts;
}

export async function GET() {
  try {
    const [services, users] = await Promise.all([
      prismaDb.service.findMany({
        include: {
          provider: { select: { id: true, name: true, image: true, email: true, emailVerified: true, role: true } },
        },
        take: 30,
        orderBy: { createdAt: "desc" },
      }),
      prismaDb.user.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true, image: true, role: true },
        take: 20,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const serviceIds = services.map((service: any) => String(service.id || "")).filter(Boolean);
    const providerEmails = Array.from(
      new Set(
        services
          .map((service: any) => String(service?.provider?.email || "").trim())
          .filter(Boolean),
      ),
    );

    const [commentCounts, locationsByEmail] = await Promise.all([
      getCommentCounts(serviceIds),
      getLocationByEmail(providerEmails),
    ]);

    const posts = services.map((service: any) => {
      const email = String(service?.provider?.email || "").trim();
      const location = email
        ? locationsByEmail.get(normalizeEmail(email)) || ""
        : "";
      const comments = commentCounts.get(String(service.id || "")) || 0;

      return {
        id: String(service.id || ""),
        author: {
          id: String(service.provider?.id || ""),
          name: service.provider?.name || "Provider",
          avatar: service.provider?.image || "/placeholder.svg",
          verified: Boolean(service.provider?.emailVerified),
          role: String(service.provider?.role || service.category || "Specialist"),
          followers: 0,
        },
        content: service.description || service.name,
        images: service.image ? [service.image] : [],
        likes: 0,
        comments,
        shares: 0,
        timestamp: new Date(service.createdAt).toLocaleDateString(),
        location,
      };
    });

    const trendingCategories = Array.from(
      new Set(
        services.map((service: any) => String(service.category || "general")),
      ),
    ) as string[];

    const trendingTopics = trendingCategories
      .slice(0, 8)
      .map((category: string) => ({
        tag: `#${category.replace(/\s+/g, "")}`,
        posts: services.filter(
          (service: any) => String(service.category) === category,
        ).length,
      }));

    const groupCategories = Array.from(
      new Set(
        services.map((service: any) => String(service.category || "General")),
      ),
    ) as string[];

    const suggestedGroups = groupCategories
      .slice(0, 6)
      .map((name: string) => ({
        id: String(name || "general").toLowerCase().replace(/\s+/g, "-"),
        name: `${name} Community`,
        members: services.filter(
          (service: any) => String(service.category || "General") === name,
        ).length,
        image:
          services.find(
            (service: any) => String(service.category || "General") === name,
          )?.image || "/placeholder.svg",
        description: `${name} discussions and updates`,
      }));

    const suggestedUsers = users
      .slice(0, 8)
      .map((user: any) => ({
        id: String(user.id || ""),
        name: user.name || "User",
        avatar: user.image || "/placeholder.svg",
        role: String(user.role || "member"),
        followers: 0,
      }));

    return NextResponse.json({
      ok: true,
      data: {
        posts,
        trendingTopics,
        suggestedGroups,
        suggestedUsers,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load community feed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
