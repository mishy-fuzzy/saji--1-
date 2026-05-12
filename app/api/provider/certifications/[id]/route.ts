import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth";

const prismaDb: any = db;
const CERT_MODE = "provider-certification";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    if (!hasAnyRole(actor, ["provider", "shopkeeper", "admin", "sub-admin", "subadmin"])) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const targetId = String(id || "").trim();

    if (!targetId) {
      return NextResponse.json(
        { ok: false, error: "Certification not found" },
        { status: 404 },
      );
    }

    const existing = await prismaDb.authLog.findFirst({
      where: {
        id: targetId,
        provider: "local",
        mode: CERT_MODE,
        email: actor.id,
        status: { not: "DELETED" },
      },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Certification not found" },
        { status: 404 },
      );
    }

    await prismaDb.authLog.update({
      where: { id: existing.id },
      data: { status: "DELETED" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to remove certification";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
