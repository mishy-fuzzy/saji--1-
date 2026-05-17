// Lightweight in-memory notification bus for Server-Sent Events (SSE)
// Note: module-scope memory is fine for local dev; for production use a durable
// pub/sub (Redis, Pusher, etc.).

type ClientEntry = {
  id: string
  send: (data: any) => void
  close: () => void
}

const clients = new Map<string, ClientEntry>()

export function createSSEStream(clientId: string) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      function send(data: any) {
        const payload = `data: ${JSON.stringify(data)}\n\n`
        try {
          controller.enqueue(encoder.encode(payload))
        } catch (e) {
          // ignore enqueue errors
        }
      }

      function close() {
        try {
          controller.close()
        } catch (e) {
          /* ignore */
        }
        clients.delete(clientId)
      }

      clients.set(clientId, { id: clientId, send, close })

      // send initial connected event
      send({ type: 'connected', clientId })

      // keepalive ping to prevent some proxies from closing idle connections
      const keepAlive = setInterval(() => {
        send({ type: 'ping', ts: Date.now() })
      }, 20000)

      ;(controller as any)._onCancel = () => {
        clearInterval(keepAlive)
        clients.delete(clientId)
      }
    },
    cancel() {
      const entry = clients.get(clientId)
      if (entry) entry.close()
    },
  })

  return stream
}

export function broadcast(data: any) {
  for (const [, entry] of clients) {
    try {
      entry.send(data)
    } catch {
      // ignore per-client errors
    }
  }
}

export function sendToClient(clientId: string, data: any) {
  const entry = clients.get(clientId)
  if (!entry) return false
  try {
    entry.send(data)
    return true
  } catch {
    return false
  }
}

export function getClientCount() {
  return clients.size
}
