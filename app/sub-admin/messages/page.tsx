"use client"

import { useEffect, useMemo, useState } from "react"
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

export default function SubAdminMessagesPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [search, setSearch] = useState("")
  const [msg, setMsg] = useState("")
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
    const response = await fetch("/api/sub-admin/users", { cache: "no-store" })
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
    const text = msg.trim()
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

      setMsg("")
      await Promise.all([loadThread(selectedPeerId), loadConversations()])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send message"
      setError(message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-140px)] lg:h-[calc(100vh-100px)] bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className={`${selectedPeerId ? "hidden sm:flex" : "flex"} flex-col w-full sm:w-80 border-r border-gray-200 dark:border-gray-700`}>
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-bold text-gray-900 dark:text-white mb-2">Messages</h2>
          <div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm outline-none text-gray-700 dark:text-gray-200"/></div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
          {conversationRows.map(c=>(
            <button key={c.peerId} onClick={()=>setSelectedPeerId(c.peerId)} className={`w-full text-left px-3 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${selectedPeerId===c.peerId?"bg-blue-50 dark:bg-blue-900/20":""}`}>
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{c.peer.name.slice(0,1)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between"><p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.peer.name}</p><span className="text-[10px] text-gray-400 flex-shrink-0">{c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</span></div>
                <p className="text-xs text-gray-500 truncate">{c.lastMessage}</p>
              </div>
              {c.unread>0&&<span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold flex-shrink-0">{c.unread}</span>}
            </button>
          ))}
          {!loading && conversationRows.length === 0 && <p className="p-4 text-sm text-gray-500">No conversations found.</p>}
        </div>
      </div>
      <div className={`${selectedPeerId?"flex":"hidden sm:flex"} flex-col flex-1`}>
        {selectedPeer?(<>
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
            <button onClick={()=>setSelectedPeerId(null)} className="sm:hidden text-gray-600 dark:text-gray-300"><ArrowLeft size={20}/></button>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">{selectedPeer.name.slice(0,1)}</div>
            <div><p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedPeer.name}</p><p className="text-[10px] text-gray-500">{selectedPeer.role}</p></div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m)=>(<div key={m.id} className={`flex ${m.senderId===selectedPeerId?"justify-start":"justify-end"}`}><div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${m.senderId===selectedPeerId?"bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm":"bg-blue-600 text-white rounded-br-sm"}`}><p>{m.text}</p><p className={`text-[9px] mt-1 ${m.senderId===selectedPeerId?"text-gray-400":"text-blue-200"}`}>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p></div></div>))}
            {messages.length === 0 && <p className="text-sm text-gray-500">No messages yet.</p>}
          </div>
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            <input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSend()} placeholder="Type a message..." className="flex-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm outline-none text-gray-900 dark:text-white" />
            <button onClick={handleSend} disabled={sending} className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-colors disabled:opacity-50"><Send size={16} /></button>
          </div>
        </>):(<div className="flex-1 flex items-center justify-center text-center p-6"><p className="text-gray-400 text-sm">Select a conversation to start messaging</p></div>)}
      </div>
      {error && <div className="absolute bottom-4 right-4 bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}
    </div>
  )
}
