import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

function sanitizeUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.trim().split(/\s+/)[0];
}

const pooledUrl = sanitizeUrl(process.env.DATABASE_URL);
const directUrl = sanitizeUrl(process.env.DIRECT_DATABASE_URL);

const datasourceUrl =
  process.env.NODE_ENV === "development"
    ? directUrl || pooledUrl
    : pooledUrl || directUrl;

export const db: PrismaClient =
  global.__prisma__ ||
  new PrismaClient(
    datasourceUrl
      ? {
          datasourceUrl,
        }
      : undefined,
  );

if (process.env.NODE_ENV !== "production") {
  global.__prisma__ = db;
}

export function serializePayload(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return "[unserializable]";
  }
}
