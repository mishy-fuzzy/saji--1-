import { NextResponse } from 'next/server'
import { createSSEStream } from '@/lib/server/notifications'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const clientId = url.searchParams.get('clientId') || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  const stream = createSSEStream(clientId)

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
