import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth";

export async function GET() {
  const jobs = await db.job.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      postedBy: { select: { id: true, name: true, email: true } },
      provider: {
        select: { id: true, name: true, email: true, phone: true, image: true },
      },
      service: {
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          basePrice: true,
          image: true,
        },
      },
    },
  });

  return NextResponse.json({ ok: true, jobs });
}

export async function POST(request: Request) {
  const { actor, error } = await getSessionActor(request);
  if (error) return error;

  if (!actor || !hasAnyRole(actor, ["admin"])) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 },
    );
  }

  const body = await request.json();

  const title = String(body?.title || "").trim();
  const description = String(body?.description || "").trim();
  const price = Number(body?.price);
  const location = String(body?.location || "").trim();
  const providerId = String(body?.providerId || "").trim() || null;
  const serviceId = String(body?.serviceId || "").trim() || null;

  if (!title || !description || !Number.isFinite(price)) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields" },
      { status: 400 },
    );
  }

  if (providerId) {
    const verifiedProvider = await db.verification.findFirst({
      where: {
        userId: providerId,
        status: "approved",
      },
      select: { id: true },
    });

    if (!verifiedProvider) {
      return NextResponse.json(
        { ok: false, error: "Provider must be verified before assignment" },
        { status: 400 },
      );
    }
  }

  const job = await db.job.create({
    data: {
      title,
      description,
      postedById: actor.id,
      providerId,
      serviceId,
      location: location || null,
      price: Math.round(price),
      currency: String(body?.currency || "KES"),
    },
  });

  return NextResponse.json({ ok: true, job }, { status: 201 });
}
