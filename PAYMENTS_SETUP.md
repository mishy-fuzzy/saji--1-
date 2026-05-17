Payment webhook strategy

This project includes a generic webhook receiver at `/api/payments/webhook` to receive payment provider events (Stripe, PayPal, etc.) and forward them to connected clients via the SSE bus (`/api/notifications/stream`).

How it routes events
- Preferred: include `clientId` in the payment's `metadata` when creating the payment (e.g. `metadata: { clientId: '<clientId>' }`). The webhook handler will route events to that specific SSE client using `sendToClient(clientId, ...)`.
- Fallback: include an `orderId` in `metadata` (or the payment object). The handler will broadcast the event and include the `orderId` so clients can filter messages client-side.
- Default: if no routing metadata is present, the webhook is broadcast to all connected clients.

Stripe notes
- If you want signature verification, set `STRIPE_WEBHOOK_SECRET` in your env and install the Stripe SDK:

```bash
pnpm add stripe
```

- When configured the webhook handler will attempt to verify the Stripe signature header (`stripe-signature`) before parsing the event body.

How to attach `clientId` when creating a Stripe Checkout session (example):

```js
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [...],
  mode: 'payment',
  success_url: 'https://your-site/success',
  cancel_url: 'https://your-site/cancel',
  metadata: { clientId: '<clientId>' }
})
```

Testing the webhook locally
- If your app is running at `http://localhost:3500`, you can POST a sample payload to the webhook to simulate a provider event:

```bash
curl -X POST http://localhost:3500/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{ "type": "checkout.session.completed", "data": { "object": { "id": "cs_test", "metadata": { "clientId": "user-123-abc", "orderId": "order_456" } } } }'
```

Notes & next steps
- Persist mapping between order/session and clientId in your database so you can reliably route events by `orderId` (recommended). Use Prisma to store `orderId -> clientId` mapping when you create the payment session.
- Add signature verification for your chosen provider (Stripe shown above). Validate the provider's webhook signature header rather than trusting incoming JSON.
- For local development, use a tunneling tool like `ngrok` to expose your local server to the provider's webhook registration UI.
