import { PrismaClient } from "@prisma/client"

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined
}

export const db: PrismaClient = global.__prisma__ || new PrismaClient()

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
