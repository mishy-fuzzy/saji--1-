import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth";

const prismaDb: any = db;
const CERT_MODE = "provider-certification";

type CertificationStatus = "verified" | "pending" | "expired";

type CertificationPayload = {
  name: string;
  issuer: string;
  dateIssued: string;
  expiryDate: string;
  status: CertificationStatus;
  category: string;
  documentUrl?: string;
};

function safeText(value: unknown): string {
  return String(value || "").trim();
}

function normalizeStatus(value: unknown): CertificationStatus {
  const raw = safeText(value).toLowerCase();
  if (raw === "verified") return "verified";
  if (raw === "expired") return "expired";
  return "pending";
}

function parseCertification(raw: unknown): CertificationPayload | null {
  if (typeof raw !== "string" || !raw.trim()) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<CertificationPayload>;
    const name = safeText(parsed.name);
    const issuer = safeText(parsed.issuer);

    if (!name || !issuer) return null;

    return {
      name,
      issuer,
      dateIssued: safeText(parsed.dateIssued),
      expiryDate: safeText(parsed.expiryDate),
      status: normalizeStatus(parsed.status),
      category: safeText(parsed.category) || "General",
      documentUrl: parsed.documentUrl ? safeText(parsed.documentUrl) : undefined,
    };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    if (!hasAnyRole(actor, ["provider", "shopkeeper", "admin", "sub-admin", "subadmin"])) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const rows = await prismaDb.authLog.findMany({
      where: {
        provider: "local",
        mode: CERT_MODE,
        email: actor.id,
        status: { not: "DELETED" },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, response: true },
    });

    const data = rows
      .map((row: any) => {
        const payload = parseCertification(row?.response);
        if (!payload) return null;
        return { id: String(row.id), ...payload };
      })
      .filter(Boolean);

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load certifications";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    if (!hasAnyRole(actor, ["provider", "shopkeeper", "admin", "sub-admin", "subadmin"])) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const name = safeText(body?.name);
    const issuer = safeText(body?.issuer);
    const dateIssued = safeText(body?.dateIssued);
    const expiryDate = safeText(body?.expiryDate);
    const category = safeText(body?.category) || "General";
    const documentUrl = safeText(body?.documentUrl);

    if (!name || !issuer) {
      return NextResponse.json(
        { ok: false, error: "Name and issuer are required" },
        { status: 400 },
      );
    }

    const payload: CertificationPayload = {
      name,
      issuer,
      dateIssued,
      expiryDate,
      status: "pending",
      category,
      documentUrl: documentUrl || undefined,
    };

    const row = await prismaDb.authLog.create({
      data: {
        provider: "local",
        mode: CERT_MODE,
        email: actor.id,
        status: "ACTIVE",
        response: JSON.stringify(payload),
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, data: { id: String(row.id), ...payload } });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to add certification";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
