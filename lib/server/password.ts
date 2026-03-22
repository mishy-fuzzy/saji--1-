import { randomBytes, scryptSync, timingSafeEqual } from "crypto"

const KEYLEN = 64

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, KEYLEN).toString("hex")
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, encodedHash: string): boolean {
  const [salt, stored] = String(encodedHash || "").split(":")
  if (!salt || !stored) {
    return false
  }

  const computed = scryptSync(password, salt, KEYLEN)
  const storedBuffer = Buffer.from(stored, "hex")

  if (computed.length !== storedBuffer.length) {
    return false
  }

  return timingSafeEqual(computed, storedBuffer)
}
