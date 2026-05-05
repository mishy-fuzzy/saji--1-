import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

const prismaDb: any = db;

type ParsedOptions = {
  categories: string[];
  counties: string[];
};

function cleanCounty(location: string): string {
  const raw = String(location || "").trim();
  if (!raw) return "";
  return raw.split(",")[0].trim();
}

function toCleanText(value: unknown): string {
  return String(value || "").trim();
}

function countyFromLocation(location: unknown): string {
  const raw = toCleanText(location);
  if (!raw) return "";
  const parts = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length ? parts[parts.length - 1] : "";
}

function parseLogOptions(raw: string | null | undefined): ParsedOptions {
  if (!raw) {
    return { categories: [], counties: [] };
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown> & {
      form?: Record<string, unknown>;
    };

    const categoryCandidates = [
      parsed?.form?.shopCategory,
      parsed?.form?.businessCategory,
      parsed?.shopCategory,
      parsed?.businessCategory,
    ]
      .map((value) => toCleanText(value))
      .filter(Boolean);

    const countyCandidates = [
      parsed?.form?.county,
      parsed?.county,
      countyFromLocation(parsed?.shopLocation),
      countyFromLocation(parsed?.form?.shopLocation),
    ]
      .map((value) => toCleanText(value))
      .filter(Boolean);

    return {
      categories: Array.from(new Set(categoryCandidates)),
      counties: Array.from(new Set(countyCandidates)),
    };
  } catch {
    return { categories: [], counties: [] };
  }
}

export async function GET() {
  try {
    const [services, jobs, authLogs] = await Promise.all([
      prismaDb.service.findMany({
        where: { category: { not: null } },
        select: { category: true },
        distinct: ["category"],
        take: 200,
      }),
      prismaDb.job.findMany({
        where: { location: { not: null } },
        select: { location: true },
        take: 500,
      }),
      prismaDb.authLog.findMany({
        where: {
          provider: "local",
          mode: { in: ["shopkeeper-registration", "shopkeeper-settings"] },
          response: { not: null },
        },
        select: { response: true },
        take: 1000,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const dbCategories = services
      .map((row: any) => String(row.category || "").trim())
      .filter(Boolean)

    const logDerived = authLogs.map((row: any) => parseLogOptions(row.response));

    const logCategories = logDerived.flatMap((item) => item.categories);

    const categories = Array.from(new Set([...dbCategories, ...logCategories]))
      .sort((a: string, b: string) => a.localeCompare(b));

    const dbCounties = jobs
      .map((row: any) => cleanCounty(String(row.location || "")))
      .filter(Boolean)

    const logCounties = logDerived.flatMap((item) => item.counties);

    const counties: string[] = Array.from(new Set([...dbCounties, ...logCounties]));

    counties.sort((a: string, b: string) => a.localeCompare(b));

    return NextResponse.json({ ok: true, data: { categories, counties } });
  } catch {
    return NextResponse.json({
      ok: true,
      data: { categories: [], counties: [] },
    });
  }
}
