import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth";

const prismaDb: any = db;

type ShopkeeperSettingsPayload = {
  shopName: string;
  businessRegistration: string;
  contactEmail: string;
  contactPhone: string;
  shopLocation: string;
  website: string;
  businessDescription: string;
  businessCategory: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  orderNotifications: boolean;
  reviewNotifications: boolean;
  promotionalEmails: boolean;
  pushNotifications: boolean;
  twoFactorAuth: boolean;
  loginAlerts: boolean;
  deviceManagement: boolean;
  apiKeys: boolean;
};

const DEFAULT_SETTINGS: ShopkeeperSettingsPayload = {
  shopName: "",
  businessRegistration: "",
  contactEmail: "",
  contactPhone: "",
  shopLocation: "",
  website: "",
  businessDescription: "",
  businessCategory: "",
  emailNotifications: false,
  smsNotifications: false,
  orderNotifications: false,
  reviewNotifications: false,
  promotionalEmails: false,
  pushNotifications: false,
  twoFactorAuth: false,
  loginAlerts: false,
  deviceManagement: false,
  apiKeys: false,
};

function safeString(value: unknown): string {
  return String(value || "").trim();
}

function parseRegistration(raw: string | null | undefined): {
  shopName: string;
  shopCategory: string;
  shopDescription: string;
  county: string;
  town: string;
  streetAddress: string;
  buildingName: string;
  kraPIN: string;
  idNumber: string;
} {
  if (!raw) {
    return {
      shopName: "",
      shopCategory: "",
      shopDescription: "",
      county: "",
      town: "",
      streetAddress: "",
      buildingName: "",
      kraPIN: "",
      idNumber: "",
    };
  }

  try {
    const parsed = JSON.parse(raw) as {
      form?: Record<string, unknown>;
    };
    const form = parsed?.form || {};
    return {
      shopName: safeString(form.shopName),
      shopCategory: safeString(form.shopCategory),
      shopDescription: safeString(form.shopDescription),
      county: safeString(form.county),
      town: safeString(form.town),
      streetAddress: safeString(form.streetAddress),
      buildingName: safeString(form.buildingName),
      kraPIN: safeString(form.kraPIN),
      idNumber: safeString(form.idNumber),
    };
  } catch {
    return {
      shopName: "",
      shopCategory: "",
      shopDescription: "",
      county: "",
      town: "",
      streetAddress: "",
      buildingName: "",
      kraPIN: "",
      idNumber: "",
    };
  }
}

function parseSavedSettings(raw: string | null | undefined): ShopkeeperSettingsPayload {
  if (!raw) return DEFAULT_SETTINGS;

  try {
    const parsed = JSON.parse(raw) as Partial<ShopkeeperSettingsPayload>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      shopName: safeString(parsed.shopName),
      businessRegistration: safeString(parsed.businessRegistration),
      contactEmail: safeString(parsed.contactEmail),
      contactPhone: safeString(parsed.contactPhone),
      shopLocation: safeString(parsed.shopLocation),
      website: safeString(parsed.website),
      businessDescription: safeString(parsed.businessDescription),
      businessCategory: safeString(parsed.businessCategory),
      emailNotifications: Boolean(parsed.emailNotifications),
      smsNotifications: Boolean(parsed.smsNotifications),
      orderNotifications: Boolean(parsed.orderNotifications),
      reviewNotifications: Boolean(parsed.reviewNotifications),
      promotionalEmails: Boolean(parsed.promotionalEmails),
      pushNotifications: Boolean(parsed.pushNotifications),
      twoFactorAuth: Boolean(parsed.twoFactorAuth),
      loginAlerts: Boolean(parsed.loginAlerts),
      deviceManagement: Boolean(parsed.deviceManagement),
      apiKeys: Boolean(parsed.apiKeys),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function composeLocation(parts: {
  streetAddress: string;
  town: string;
  county: string;
  buildingName: string;
}): string {
  return [parts.buildingName, parts.streetAddress, parts.town, parts.county]
    .map((item) => safeString(item))
    .filter(Boolean)
    .join(", ");
}

export async function GET(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    if (!hasAnyRole(actor, ["shopkeeper", "admin", "sub-admin", "subadmin"])) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const user = await prismaDb.user.findFirst({
      where: { id: actor.id, deletedAt: null },
      select: {
        name: true,
        email: true,
        phone: true,
      },
    });

    const [registrationLog, settingsLog] = await Promise.all([
      prismaDb.authLog.findFirst({
        where: {
          provider: "local",
          mode: "shopkeeper-registration",
          email: String(user?.email || ""),
        },
        orderBy: { createdAt: "desc" },
        select: { response: true },
      }),
      prismaDb.authLog.findFirst({
        where: {
          provider: "local",
          mode: "shopkeeper-settings",
          email: String(user?.email || ""),
          status: "SUCCESS",
        },
        orderBy: { createdAt: "desc" },
        select: { response: true },
      }),
    ]);

    const registration = parseRegistration(registrationLog?.response);
    const savedSettings = parseSavedSettings(settingsLog?.response);

    const derivedRegistrationCode = safeString(registration.kraPIN || registration.idNumber);
    const derivedLocation = composeLocation({
      streetAddress: registration.streetAddress,
      town: registration.town,
      county: registration.county,
      buildingName: registration.buildingName,
    });

    const data: ShopkeeperSettingsPayload = {
      ...savedSettings,
      shopName: safeString(savedSettings.shopName || registration.shopName || user?.name),
      businessRegistration: safeString(savedSettings.businessRegistration || derivedRegistrationCode),
      contactEmail: safeString(savedSettings.contactEmail || user?.email),
      contactPhone: safeString(savedSettings.contactPhone || user?.phone),
      shopLocation: safeString(savedSettings.shopLocation || derivedLocation),
      website: safeString(savedSettings.website),
      businessDescription: safeString(savedSettings.businessDescription || registration.shopDescription),
      businessCategory: safeString(savedSettings.businessCategory || registration.shopCategory),
    };

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load settings";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    if (!hasAnyRole(actor, ["shopkeeper", "admin", "sub-admin", "subadmin"])) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const incoming = (body?.settings || {}) as Partial<ShopkeeperSettingsPayload>;

    const user = await prismaDb.user.findFirst({
      where: { id: actor.id, deletedAt: null },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const latest = await prismaDb.authLog.findFirst({
      where: {
        provider: "local",
        mode: "shopkeeper-settings",
        email: user.email,
        status: "SUCCESS",
      },
      orderBy: { createdAt: "desc" },
      select: { response: true },
    });

    const current = parseSavedSettings(latest?.response);
    const next: ShopkeeperSettingsPayload = {
      ...current,
      ...incoming,
      shopName: safeString(incoming.shopName ?? current.shopName),
      businessRegistration: safeString(incoming.businessRegistration ?? current.businessRegistration),
      contactEmail: safeString(incoming.contactEmail ?? current.contactEmail),
      contactPhone: safeString(incoming.contactPhone ?? current.contactPhone),
      shopLocation: safeString(incoming.shopLocation ?? current.shopLocation),
      website: safeString(incoming.website ?? current.website),
      businessDescription: safeString(incoming.businessDescription ?? current.businessDescription),
      businessCategory: safeString(incoming.businessCategory ?? current.businessCategory),
      emailNotifications: Boolean(incoming.emailNotifications ?? current.emailNotifications),
      smsNotifications: Boolean(incoming.smsNotifications ?? current.smsNotifications),
      orderNotifications: Boolean(incoming.orderNotifications ?? current.orderNotifications),
      reviewNotifications: Boolean(incoming.reviewNotifications ?? current.reviewNotifications),
      promotionalEmails: Boolean(incoming.promotionalEmails ?? current.promotionalEmails),
      pushNotifications: Boolean(incoming.pushNotifications ?? current.pushNotifications),
      twoFactorAuth: Boolean(incoming.twoFactorAuth ?? current.twoFactorAuth),
      loginAlerts: Boolean(incoming.loginAlerts ?? current.loginAlerts),
      deviceManagement: Boolean(incoming.deviceManagement ?? current.deviceManagement),
      apiKeys: Boolean(incoming.apiKeys ?? current.apiKeys),
    };

    await prismaDb.user.update({
      where: { id: user.id },
      data: {
        name: next.shopName || undefined,
        email: next.contactEmail || undefined,
        phone: next.contactPhone || "",
      },
    });

    await prismaDb.authLog.create({
      data: {
        provider: "local",
        mode: "shopkeeper-settings",
        email: next.contactEmail || user.email,
        status: "SUCCESS",
        response: JSON.stringify(next),
      },
    });

    return NextResponse.json({ ok: true, data: next });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update settings";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
