"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Send, ArrowLeft } from "lucide-react"

type Contact = {
  id: string
  name: string
  role: string
}

type ConversationItem = {
  peerId: string
  lastMessage: string
  createdAt: string
  unread: number
  peer: Contact
}

type ChatMessage = {
  id: string
  text: string
  senderId: string
  receiverId: string
  createdAt: string
}

export default function SecretaryMessagesPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [search, setSearch] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")

  async function loadConversations() {
    const response = await fetch("/api/messages", { cache: "no-store" })
    const payload = await response.json()
    if (!response.ok || !payload?.ok) {
      throw new Error(payload?.error || "Failed to load conversations")
    }
    const rows = Array.isArray(payload.data) ? payload.data : []
    setConversations(rows)
    if (!selectedPeerId && rows.length > 0) {
      setSelectedPeerId(rows[0].peerId)
    }
  }

  async function loadContacts() {
    const response = await fetch("/api/secretary/users", { cache: "no-store" })
    const payload = await response.json()
    if (!response.ok || !payload?.ok) {
      throw new Error(payload?.error || "Failed to load contacts")
    }

    const rows = Array.isArray(payload.data) ? payload.data : []
    const normalized = rows.map((row: any) => ({
      id: String(row.id),
      name: String(row.name || "User"),
      role: String(row.role || "User"),
    }))
    setContacts(normalized)
  }

  async function loadThread(peerId: string) {
    const response = await fetch(`/api/messages?withUserId=${encodeURIComponent(peerId)}`, { cache: "no-store" })
    const payload = await response.json()
    if (!response.ok || !payload?.ok) {
      throw new Error(payload?.error || "Failed to load messages")
    }
    setMessages(Array.isArray(payload.data) ? payload.data : [])
  }

  useEffect(() => {
    let mounted = true

    const bootstrap = async () => {
      setLoading(true)
      setError("")
      try {
        await Promise.all([loadContacts(), loadConversations()])
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load messages"
        if (mounted) setError(message)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    bootstrap()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!selectedPeerId) return
    loadThread(selectedPeerId).catch((err) => {
      const message = err instanceof Error ? err.message : "Failed to load thread"
      setError(message)
    })
  }, [selectedPeerId])

  const conversationRows = useMemo(() => {
    const byPeerId = new Map(conversations.map((item) => [item.peerId, item]))
    const merged = contacts.map((contact) => {
      const conv = byPeerId.get(contact.id)
      return {
        peerId: contact.id,
        peer: contact,
        lastMessage: conv?.lastMessage || "No messages yet",
        createdAt: conv?.createdAt || "",
        unread: conv?.unread || 0,
      }
    })

    return merged
      .filter((item) => item.peer.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }, [contacts, conversations, search])

  const selectedPeer = conversationRows.find((item) => item.peerId === selectedPeerId)?.peer || contacts.find((c) => c.id === selectedPeerId)

  const handleSend = async () => {
    const text = message.trim()
    if (!text || !selectedPeerId) return

    setSending(true)
    setError("")
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: selectedPeerId, text }),
      })

      const payload = await response.json()
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Failed to send message")
      }

      setMessage("")
      await Promise.all([loadThread(selectedPeerId), loadConversations()])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send message"
      setError(message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-5rem)]">
      <Card className="flex h-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className={`w-full lg:w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col ${selectedPeerId ? "hidden lg:flex" : "flex"}`}>
          <div className="p-3 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Messages</h2>
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
              <Search size={14} className="text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations..." className="bg-transparent text-sm outline-none flex-1 text-gray-700 dark:text-gray-200 placeholder:text-gray-400" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
            {conversationRows.map(conv => (
              <button key={conv.peerId} onClick={() => setSelectedPeerId(conv.peerId)} className={`w-full text-left px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${selectedPeerId === conv.peerId ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">{conv.peer.name.split(" ").map(p => p[0]).join("").slice(0,2)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{conv.peer.name}</p>
                      <span className="text-[10px] text-gray-400">{conv.createdAt ? new Date(conv.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 ? <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">{conv.unread}</span> : null}
                </div>
              </button>
            ))}
            {!loading && conversationRows.length === 0 && <p className="p-4 text-sm text-gray-500">No conversations found.</p>}
          </div>
        </div>

        <div className={`flex-1 flex flex-col ${selectedPeerId ? "flex" : "hidden lg:flex"}`}>
          {selectedPeer ? (
            <>
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                <button onClick={() => setSelectedPeerId(null)} className="lg:hidden text-gray-600 dark:text-gray-300"><ArrowLeft size={20} /></button>
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-xs">{selectedPeer.name.split(" ").map(p => p[0]).join("").slice(0,2)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{selectedPeer.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{selectedPeer.role}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-gray-900/20">
                {messages.map(m => {
                  const incoming = m.senderId === selectedPeerId
                  return (
                    <div key={m.id} className={`flex ${incoming ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${incoming ? "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100" : "bg-blue-600 text-white"}`}>
                        <p className="whitespace-pre-wrap break-words">{m.text}</p>
                        <p className={`text-[10px] mt-1 ${incoming ? "text-gray-400" : "text-blue-100"}`}>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  )
                })}
                {messages.length === 0 && <p className="text-sm text-gray-500">No messages yet.</p>}
              </div>

              <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Type a message..." className="flex-1 bg-gray-100 dark:bg-gray-700 text-sm rounded-full px-4 py-2.5 outline-none text-gray-900 dark:text-white placeholder:text-gray-400" onKeyDown={e => { if (e.key === "Enter") handleSend() }} />
                <Button size="sm" className="rounded-full w-9 h-9 p-0 bg-blue-600 hover:bg-blue-700" onClick={handleSend} disabled={sending}><Send size={16} /></Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Select a conversation to view messages</div>
          )}
        </div>

        {error && <div className="absolute bottom-4 right-4 bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}
      </Card>
    </div>
  )
}
