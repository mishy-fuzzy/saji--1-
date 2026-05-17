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

// Create the raw Prisma client instance
const rawPrisma: PrismaClient =
  global.__prisma__ ||
  new PrismaClient(
    datasourceUrl
      ? {
          datasourceUrl,
        }
      : undefined,
  );

if (process.env.NODE_ENV !== "production") {
  global.__prisma__ = rawPrisma;
}

// Wrap the Prisma client in a Proxy to gracefully handle accesses to
// models that might not exist in the schema at runtime. This prevents
// `Cannot read properties of undefined (reading 'findMany')` when
// code calls e.g. `db.someMissingModel.findMany(...)`.
const proxyHandler: ProxyHandler<PrismaClient> = {
  get(target, prop, receiver) {
    // If the property exists on the real client, return it (preserve binding)
    if (prop in target) {
      const value = Reflect.get(target as any, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    }

    // Otherwise return a safe delegate that provides common query methods.
    const safeDelegate = new Proxy(
      {},
      {
        get(_, methodName) {
          const m = String(methodName);
          // Read-only queries return empty results by default
          if (["findMany", "findFirst", "findUnique", "count", "aggregate", "groupBy"].includes(m)) {
            return async () => [];
          }

          // Mutations should surface a clear error so writes don't silently succeed
          if (["create", "update", "delete", "updateMany", "deleteMany", "upsert", "createMany"].includes(m)) {
            return async () => {
              throw new Error(`Prisma model '${String(prop)}' is not present in the schema`);
            };
          }

          // Default no-op
          return async () => undefined;
        },
      },
    );

    return safeDelegate as any;
  },
};

export const db: PrismaClient = new Proxy(rawPrisma, proxyHandler) as unknown as PrismaClient;

export function serializePayload(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return "[unserializable]";
  }
}
