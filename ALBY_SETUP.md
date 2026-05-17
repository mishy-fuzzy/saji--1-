Alby integration (live notifications)

This project includes a minimal integration for receiving Alby webhook events and broadcasting them in real-time to connected clients using Server-Sent Events (SSE).

Files added:

- `app/api/alby/webhook/route.ts` — webhook receiver for Alby events (POST).
- `app/api/alby/register/route.ts` — register an Alby pubkey / clientId mapping (POST).
- `app/api/notifications/stream/route.ts` — SSE endpoint a client can open to receive live notifications.
- `lib/server/notifications.ts` — in-memory SSE notification bus.
- `lib/server/alby-clients.ts` — in-memory registry for Alby client mappings.
- `components/alby-connector.tsx` — client UI to register a pubkey and open the SSE stream.

How it works

1. Clients register via `POST /api/alby/register` with their `userId`, `albyPubKey`, and a generated `clientId`.
2. Clients open an SSE connection to `/api/notifications/stream?clientId=<clientId>` to receive events.
3. Configure your Alby webhook (in the Alby dashboard or via their API) to point to `https://<your-host>/api/alby/webhook` so Alby will POST events to your app.
4. The webhook handler will try to map incoming events to a registered `albyPubKey`. If found, events are targeted to that client's `clientId`. Otherwise events are broadcast to all connected clients.

Notes and next steps

- This is intentionally minimal and uses in-memory maps; for a production setup persist registrations in your database (Prisma) and use a durable pub/sub (Redis, Kafka, Pusher, etc.) for cross-instance delivery.
- Add verification for incoming Alby webhook signatures if Alby supports signing (recommended).
- Consider adding authentication and permission checks on `/api/alby/register`.
- If you prefer WebSockets, we can replace SSE with a WebSocket server or use a managed realtime service.
