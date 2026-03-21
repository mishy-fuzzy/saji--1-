"use client"

import { useEffect, useState } from "react"
import { Search, Send, ArrowLeft, MoreVertical } from "lucide-react"

const ADMIN_INBOX_STORAGE_KEY = "saji-admin-inbox"
const SUB_ADMIN_CONVERSATION_ID = 9001

function publishMessageToAdminInbox(text: string) {
  if (typeof window === "undefined") return

  const now = new Date()
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  const newEntry = { sender: "Sub-Admin", text, time, type: "received" as const }

  try {
    const raw = window.localStorage.getItem(ADMIN_INBOX_STORAGE_KEY)
    const existing = raw ? JSON.parse(raw) : []

    const inbox = Array.isArray(existing) ? existing : []
    const existingIndex = inbox.findIndex((item) => item?.from === "Sub-Admin")

    let next = inbox
    if (existingIndex >= 0) {
      next = inbox.map((item, index) =>
        index === existingIndex
          ? {
              ...item,
              id: SUB_ADMIN_CONVERSATION_ID,
              message: text,
              time: "Just now",
              unread: true,
              replies: Number(item?.replies || 0) + 1,
              category: "Internal",
              thread: [...(Array.isArray(item?.thread) ? item.thread : []), newEntry],
            }
          : item
      )
    } else {
      next = [
        {
          id: SUB_ADMIN_CONVERSATION_ID,
          from: "Sub-Admin",
          message: text,
          time: "Just now",
          unread: true,
          replies: 0,
          category: "Internal",
          thread: [newEntry],
        },
        ...inbox,
      ]
    }

    window.localStorage.setItem(ADMIN_INBOX_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Keep chat UI responsive even if localStorage write fails.
  }
}

function readAdminInboxMessages() {
  if (typeof window === "undefined") return [] as { text: string; from: string; time: string }[]

  try {
    const raw = window.localStorage.getItem(ADMIN_INBOX_STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    const conversation = parsed.find((item) => item?.from === "Sub-Admin")
    const flattened = Array.isArray(conversation?.thread)
      ? conversation.thread.map((entry) => ({
          text: String(entry?.text || ""),
          from: entry?.sender === "Admin" ? "them" : "me",
          time: String(entry?.time || ""),
        }))
      : []

    const seen = new Set<string>()
    return flattened.filter((m) => {
      const key = `${m.from}|${m.time}|${m.text}`
      if (seen.has(key)) return false
      seen.add(key)
      return Boolean(m.text)
    })
  } catch {
    return []
  }
}

type Conversation = {
  id: number
  name: string
  role: string
  lastMsg: string
  time: string
  unread: number
  avatar: string
}

const initialConversations: Conversation[] = [
  { id: 1, name: "Agent Mike", role: "Agent", lastMsg: "Dispute #42 has been resolved", time: "2m", unread: 2, avatar: "M" },
  { id: 2, name: "Admin Support", role: "Admin", lastMsg: "Please review the monthly report", time: "1h", unread: 0, avatar: "A" },
  { id: 3, name: "Sarah K.", role: "Provider", lastMsg: "My verification is still pending", time: "3h", unread: 1, avatar: "S" },
  { id: 4, name: "System Bot", role: "System", lastMsg: "3 new verifications require review", time: "5h", unread: 3, avatar: "B" },
]

export default function SubAdminMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [activeChat, setActiveChat] = useState<number | null>(null)
  const [msg, setMsg] = useState("")
  const [search, setSearch] = useState("")
  const [messages, setMessages] = useState<{[key:number]: {text: string; from: string; time: string}[]}>({
    1: [{ text: "Dispute #42 has been escalated to you", from: "them", time: "10:30 AM" }, { text: "I'll review it now. Thanks!", from: "me", time: "10:32 AM" }, { text: "Dispute #42 has been resolved", from: "them", time: "11:05 AM" }],
    2: [{ text: "The monthly report is ready for your review", from: "them", time: "9:00 AM" }],
    3: [{ text: "Hi, my verification has been pending for 3 days", from: "them", time: "8:15 AM" }, { text: "I'll check and get back to you shortly", from: "me", time: "8:20 AM" }, { text: "My verification is still pending", from: "them", time: "11:00 AM" }],
    4: [{ text: "3 new verifications require your review", from: "them", time: "7:00 AM" }],
  })

  const active = conversations.find(c => c.id === activeChat)
  const chatMessages = activeChat ? messages[activeChat] || [] : []
  const filtered = conversations.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    const syncAdminConversation = () => {
      const syncedMessages = readAdminInboxMessages()
      if (!syncedMessages.length) return

      const latest = syncedMessages[syncedMessages.length - 1]

      setMessages((prev) => ({
        ...prev,
        2: syncedMessages,
      }))

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === 2
            ? {
                ...conversation,
                lastMsg: latest.text,
                time: latest.time,
                unread: latest.from === "them" && activeChat !== 2 ? 1 : 0,
              }
            : conversation
        )
      )
    }

    syncAdminConversation()
    window.addEventListener("storage", syncAdminConversation)
    return () => window.removeEventListener("storage", syncAdminConversation)
  }, [activeChat])

  useEffect(() => {
    if (activeChat !== 2) return
    setConversations((prev) => prev.map((c) => (c.id === 2 ? { ...c, unread: 0 } : c)))
  }, [activeChat])

  const handleSend = () => {
    if (!msg.trim() || !activeChat) return
    const outgoing = msg.trim()
    const activeConversation = conversations.find((c) => c.id === activeChat)

    setMessages(prev => ({ ...prev, [activeChat]: [...(prev[activeChat]||[]), { text: outgoing, from: "me", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }] }))

    if (activeConversation?.role === "Admin") {
      publishMessageToAdminInbox(outgoing)
      setConversations((prev) =>
        prev.map((c) =>
          c.id === 2
            ? {
                ...c,
                lastMsg: outgoing,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                unread: 0,
              }
            : c
        )
      )
    }

    setMsg("")
  }

  return (
    <div className="flex h-[calc(100vh-140px)] lg:h-[calc(100vh-100px)] bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Conversations List */}
      <div className={`${activeChat ? "hidden sm:flex" : "flex"} flex-col w-full sm:w-80 border-r border-gray-200 dark:border-gray-700`}>
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-bold text-gray-900 dark:text-white mb-2">Messages</h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm outline-none text-gray-700 dark:text-gray-200" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
          {filtered.map(c => (
            <button key={c.id} onClick={()=>setActiveChat(c.id)} className={`w-full text-left px-3 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${activeChat===c.id?"bg-blue-50 dark:bg-blue-900/20":""}`}>
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{c.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.name}</p>
                  <span className="text-[10px] text-gray-400 flex-shrink-0">{c.time}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{c.lastMsg}</p>
              </div>
              {c.unread > 0 && <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold flex-shrink-0">{c.unread}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${activeChat ? "flex" : "hidden sm:flex"} flex-col flex-1`}>
        {active ? (
          <>
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
              <button onClick={()=>setActiveChat(null)} className="sm:hidden text-gray-600 dark:text-gray-300"><ArrowLeft size={20} /></button>
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">{active.avatar}</div>
              <div className="flex-1"><p className="text-sm font-semibold text-gray-900 dark:text-white">{active.name}</p><p className="text-[10px] text-gray-500">{active.role}</p></div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.from==="me"?"justify-end":"justify-start"}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${m.from==="me"?"bg-blue-600 text-white rounded-br-sm":"bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm"}`}>
                    <p>{m.text}</p>
                    <p className={`text-[9px] mt-1 ${m.from==="me"?"text-blue-200":"text-gray-400"}`}>{m.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
              <input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSend()} placeholder="Type a message..." className="flex-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm outline-none text-gray-900 dark:text-white" />
              <button onClick={handleSend} className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-colors"><Send size={16} /></button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-6">
            <div><p className="text-gray-400 text-sm">Select a conversation to start messaging</p></div>
          </div>
        )}
      </div>
    </div>
  )
}
