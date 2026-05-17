"use client"
import { useEffect, useState, useRef } from 'react'
import { useAuthContext } from '@/lib/auth-context'

export default function AlbyConnector() {
  const { user } = useAuthContext()
  const [albyPubKey, setAlbyPubKey] = useState('')
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    return () => {
      if (esRef.current) {
        esRef.current.close()
        esRef.current = null
      }
    }
  }, [])

  async function register() {
    const clientId = `${user?.id || 'anon'}-${Math.random().toString(36).slice(2, 8)}`
    const res = await fetch('/api/alby/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user?.id, albyPubKey, clientId }),
    })
    const json = await res.json()
    if (!res.ok) {
      alert(json?.error || 'Registration failed')
      return
    }

    // Connect to SSE stream
    const es = new EventSource(`/api/notifications/stream?clientId=${encodeURIComponent(clientId)}`)
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data)
        setMessages((prev) => [data, ...prev].slice(0, 50))
      } catch (e) {
        // ignore
      }
    }
    es.onerror = () => {
      setConnected(false)
      es.close()
      esRef.current = null
    }
    esRef.current = es
    setConnected(true)
  }

  return (
    <div>
      <label className="text-sm font-medium">Alby PubKey</label>
      <div className="flex gap-2 mt-2">
        <input className="flex-1 rounded-xl p-2 border" value={albyPubKey} onChange={(e) => setAlbyPubKey(e.target.value)} placeholder="npub... or hex pubkey" />
        <button className="rounded-xl bg-primary px-4 text-white" onClick={register} disabled={connected}>
          {connected ? 'Connected' : 'Register & Connect'}
        </button>
      </div>

      {messages.length > 0 && (
        <div className="mt-3 space-y-2 max-h-60 overflow-auto">
          {messages.map((m, idx) => (
            <div key={idx} className="p-2 rounded border bg-muted/30 text-sm">
              <pre className="whitespace-pre-wrap">{JSON.stringify(m)}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
