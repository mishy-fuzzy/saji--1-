import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

const prismaDb: any = db;

const DEFAULT_CATEGORIES = [
  "Groceries",
  "Electronics",
  "Fashion",
  "Beauty & Cosmetics",
  "Home & Living",
  "Health & Wellness",
  "Automotive",
  "Hardware",
  "Books & Stationery",
  "Baby & Kids",
]

const DEFAULT_COUNTIES = [
  "Baringo",
  "Bomet",
  "Bungoma",
  "Busia",
  "Elgeyo-Marakwet",
  "Embu",
  "Garissa",
  "Homa Bay",
  "Isiolo",
  "Kajiado",
  "Kakamega",
  "Kericho",
  "Kiambu",
  "Kilifi",
  "Kirinyaga",
  "Kisii",
  "Kisumu",
  "Kitui",
  "Kwale",
  "Laikipia",
  "Lamu",
  "Machakos",
  "Makueni",
  "Mandera",
  "Marsabit",
  "Meru",
  "Migori",
  "Mombasa",
  "Murang'a",
  "Nairobi",
  "Nakuru",
  "Nandi",
  "Narok",
  "Nyamira",
  "Nyandarua",
  "Nyeri",
  "Samburu",
  "Siaya",
  "Taita-Taveta",
  "Tana River",
  "Tharaka-Nithi",
  "Trans Nzoia",
  "Turkana",
  "Uasin Gishu",
  "Vihiga",
  "Wajir",
  "West Pokot",
]

function cleanCounty(location: string): string {
  const raw = String(location || "").trim();
  if (!raw) return "";
  return raw.split(",")[0].trim();
}

export async function GET() {
  try {
    const [services, jobs] = await Promise.all([
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
    ]);

    const dbCategories = services
      .map((row: any) => String(row.category || "").trim())
      .filter(Boolean)

    const categories = Array.from(new Set([...dbCategories, ...DEFAULT_CATEGORIES]))
      .sort((a: string, b: string) => a.localeCompare(b));

    const dbCounties = jobs
      .map((row: any) => cleanCounty(String(row.location || "")))
      .filter(Boolean)

    const counties: string[] = Array.from(
      new Set([...dbCounties, ...DEFAULT_COUNTIES]),
    );

    counties.sort((a: string, b: string) => a.localeCompare(b));

    return NextResponse.json({ ok: true, data: { categories, counties } });
  } catch {
    return NextResponse.json({
      ok: true,
      data: { categories: DEFAULT_CATEGORIES, counties: DEFAULT_COUNTIES },
    });
  }
}
