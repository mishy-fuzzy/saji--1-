import { NextResponse } from 'next/server'
import { broadcast, sendToClient } from '@/lib/server/notifications'
import { findByAlbyPubKey } from '@/lib/server/alby-clients'

// Generic receiver for Alby notifications/webhooks.
// Register this URL in the Alby dashboard (or forward Alby events here via a Cloudflare Worker).

export async function POST(request: Request) {
  try {
    const payload = await request.json()

    // Example Alby payloads may include a `pubkey` or `from` field — this handler
    // tries to target registered clients first, then broadcasts to all.
    const pubKey = payload?.pubkey || payload?.from || payload?.sender

    if (pubKey) {
      const regs = findByAlbyPubKey(pubKey)
      if (regs.length > 0) {
        for (const r of regs) {
          if (r.clientId) {
            sendToClient(r.clientId, { type: 'alby:event', data: payload })
          }
        }
        return NextResponse.json({ ok: true })
      }
    }

    // Fallback: broadcast to all connected clients
    broadcast({ type: 'alby:event', data: payload })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('alby_webhook_error', err)
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 })
  }
}
