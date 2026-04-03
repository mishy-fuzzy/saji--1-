import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth";

const prismaDb: any = db;

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

    return NextResponse.json({
      ok: true,
      data: {
        shopName: String(user?.name || ""),
        businessRegistration: "",
        contactEmail: String(user?.email || ""),
        contactPhone: String(user?.phone || ""),
        shopLocation: "",
        businessDescription: "",
        businessCategory: "",
        emailNotifications: true,
        smsNotifications: true,
        orderNotifications: true,
        reviewNotifications: true,
        promotionalEmails: false,
        pushNotifications: true,
        twoFactorAuth: false,
        loginAlerts: true,
        deviceManagement: false,
        apiKeys: false,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load settings";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
