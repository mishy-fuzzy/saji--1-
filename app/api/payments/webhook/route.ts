import { NextResponse } from 'next/server'
import { broadcast, sendToClient } from '@/lib/server/notifications'

// Generic payment webhook receiver
// - If `STRIPE_WEBHOOK_SECRET` is set and the request contains a Stripe signature
//   header, the handler will attempt to verify the event using the `stripe` SDK (optional).
// - The handler looks for `clientId` in `event.data.object.metadata` (or several
//   common fields) to route the event to a specific connected SSE client.
// - If no clientId/order mapping is found it broadcasts the payment event to
//   all connected clients.

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()

    // Try Stripe verification when configured
    const sigHeader =
      request.headers.get('stripe-signature') || request.headers.get('Stripe-Signature') || ''
    let event: any = null

    if (process.env.STRIPE_WEBHOOK_SECRET && sigHeader) {
      try {
        const stripeModule = await import('stripe')
        const Stripe = (stripeModule && (stripeModule as any).default) || stripeModule
        const stripe = new Stripe(process.env.STRIPE_API_KEY || '', { apiVersion: '2022-11-15' })
        event = stripe.webhooks.constructEvent(rawBody, sigHeader, process.env.STRIPE_WEBHOOK_SECRET)
      } catch (err) {
        console.warn('stripe_signature_verification_failed', String(err))
        // fallback to parsing JSON body below
      }
    }

    if (!event) {
      try {
        event = JSON.parse(rawBody)
      } catch (err) {
        return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
      }
    }

    const eventType = event.type || event.event || 'payment.event'
    const dataObj = event.data?.object || event.data || event

    // Look for clientId in common locations (metadata is recommended)
    const clientId =
      dataObj?.metadata?.clientId ||
      dataObj?.metadata?.client_id ||
      dataObj?.metadata?.client ||
      dataObj?.clientId ||
      dataObj?.client_id ||
      dataObj?.client ||
      null

    const payload = { providerEvent: eventType, data: dataObj }

    if (clientId) {
      const sent = sendToClient(String(clientId), { type: 'payment:event', payload })
      if (sent) return NextResponse.json({ ok: true, routed: 'client', clientId })
    }

    // Try to find an order/session id in metadata and include it in the broadcast
    const orderId =
      dataObj?.metadata?.orderId || dataObj?.metadata?.order_id || dataObj?.orderId || dataObj?.order_id || null

    if (orderId) {
      broadcast({ type: 'payment:event', payload: { ...payload, orderId } })
      return NextResponse.json({ ok: true, broadcasted: true, orderId })
    }

    // No routing info; broadcast to all connected clients
    broadcast({ type: 'payment:event', payload })
    return NextResponse.json({ ok: true, broadcasted: true })
  } catch (err: any) {
    console.error('payment_webhook_error', err)
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 })
  }
}
