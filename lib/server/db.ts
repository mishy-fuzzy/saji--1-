const { PrismaClient } = require("@prisma/client") as {
  PrismaClient: new () => any
}

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: any | undefined
}

export const db = global.__prisma__ || new PrismaClient()

if (process.env.NODE_ENV !== "production") {
  global.__prisma__ = db
}

export function serializePayload(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return "[unserializable]"
  }
}
