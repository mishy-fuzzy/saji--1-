// Simple in-memory registry of Alby client registrations.
// For production, persist this mapping in your database (Prisma).

type Registration = {
  userId?: string
  albyPubKey?: string
  clientId?: string
  createdAt: number
}

const regs = new Map<string, Registration>()

export function registerAlby(opts: { userId?: string; albyPubKey?: string; clientId?: string }) {
  const key = opts.albyPubKey || opts.clientId || opts.userId || `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  regs.set(key, { ...opts, createdAt: Date.now() })
  return { key }
}

export function findByAlbyPubKey(pubKey?: string) {
  if (!pubKey) return []
  const out: Registration[] = []
  for (const [, r] of regs) {
    if (r.albyPubKey === pubKey) out.push(r)
  }
  return out
}

export function findByUserId(userId?: string) {
  if (!userId) return []
  const out: Registration[] = []
  for (const [, r] of regs) {
    if (r.userId === userId) out.push(r)
  }
  return out
}

export function listRegistrations() {
  return Array.from(regs.values())
}
