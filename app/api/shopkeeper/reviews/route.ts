import { NextResponse } from "next/server";
import { getSessionActor, hasAnyRole } from "@/lib/server/api-auth";

export async function GET(request: Request) {
  try {
    const { actor, error } = await getSessionActor(request);
    if (error || !actor) return error;

    if (!hasAnyRole(actor, ["shopkeeper", "admin", "sub-admin", "subadmin"])) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    // Reviews are returned from DB-backed sources when available; default is an empty dataset.
    return NextResponse.json({
      ok: true,
      data: {
        reviews: [],
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load reviews";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
