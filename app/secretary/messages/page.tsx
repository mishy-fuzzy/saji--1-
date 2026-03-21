"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Send, Paperclip, Phone, MoreVertical, ArrowLeft, CheckCheck } from "lucide-react"

type ThreadItem = {
  sender: string
  text: string
  time: string
  type: "sent" | "received"
}

type ExternalInboxItem = {
  id: number
  from: string
  message: string
  time: string
  unread: boolean
  replies: number
  category: string
  thread: ThreadItem[]
}

const ADMIN_INBOX_STORAGE_KEY = "saji-admin-inbox"
const SECRETARY_FROM = "Secretary"

function readExternalInbox(): ExternalInboxItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(ADMIN_INBOX_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as ExternalInboxItem[]) : []
  } catch {
    return []
  }
}

function writeExternalInbox(items: ExternalInboxItem[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(ADMIN_INBOX_STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Keep UI responsive even if storage write fails.
  }
}

const conversations = [
  { id: 1, name: "Agent - Kevin Otieno", role: "Agent", lastMsg: "The reconciliation for batch #4521 is complete", time: "2m ago", unread: 2, avatar: "KO" },
  { id: 2, name: "Admin - Sarah Njeri", role: "Admin", lastMsg: "Please approve the pending payouts before 5pm", time: "15m ago", unread: 1, avatar: "SN" },
  { id: 3, name: "Provider - James Mwangi", role: "Provider", lastMsg: "My withdrawal has been pending for 3 days", time: "1h ago", unread: 0, avatar: "JM" },
  { id: 4, name: "Shopkeeper - Nairobi Fresh", role: "Shopkeeper", lastMsg: "Invoice #1089 was double charged", time: "3h ago", unread: 0, avatar: "NF" },
  { id: 5, name: "Sub-Admin - Peter K.", role: "Sub-Admin", lastMsg: "Forwarding the tax documents now", time: "1d ago", unread: 0, avatar: "PK" },
]

const chatMessages = [
  { id: 1, sender: "them", text: "Hi, the reconciliation for batch #4521 has some discrepancies", time: "10:30 AM" },
  { id: 2, sender: "me", text: "Let me check. Which entries are mismatched?", time: "10:32 AM" },
  { id: 3, sender: "them", text: "Transactions #8821 and #8825 show different amounts on the bank statement vs our records", time: "10:33 AM" },
  { id: 4, sender: "me", text: "I see it. Looks like a partial refund was processed on #8825. Let me verify with the payment gateway.", time: "10:35 AM" },
  { id: 5, sender: "them", text: "The reconciliation for batch #4521 is complete", time: "10:40 AM" },
]

export default function SecretaryMessagesPage() {
  const [selectedChat, setSelectedChat] = useState<number | null>(null)
  const [message, setMessage] = useState("")
  const [search, setSearch] = useState("")
  const [adminThread, setAdminThread] = useState<ThreadItem[]>(
    chatMessages.map((msg) => ({
      sender: msg.sender === "me" ? SECRETARY_FROM : "Admin",
      text: msg.text,
      time: msg.time,
      type: msg.sender === "me" ? "received" : "sent",
    })),
  )
  const [conversationState, setConversationState] = useState(conversations)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [localMessagesByConversation, setLocalMessagesByConversation] = useState<Record<number, typeof chatMessages>>(() =>
    Object.fromEntries(conversations.map((conv) => [conv.id, [...chatMessages]])),
  )

  const selected = conversationState.find(c => c.id === selectedChat)

  useEffect(() => {
    const syncSecretaryThread = () => {
      const inbox = readExternalInbox()
      const secretaryEntry = inbox.find((item) => item.from === SECRETARY_FROM)
      if (!secretaryEntry) return

      const thread = Array.isArray(secretaryEntry.thread) ? secretaryEntry.thread : []
      setAdminThread(thread)

      setConversationState((prev) =>
        prev.map((conv) =>
          conv.role === "Admin"
            ? {
                ...conv,
                lastMsg: secretaryEntry.message || conv.lastMsg,
                time: secretaryEntry.time || conv.time,
              }
            : conv,
        ),
      )
    }

    syncSecretaryThread()
    window.addEventListener("storage", syncSecretaryThread)
    return () => window.removeEventListener("storage", syncSecretaryThread)
  }, [])

  const currentMessages =
    selected?.role === "Admin"
      ? adminThread.map((msg, idx) => ({
          id: idx + 1,
          sender: msg.sender === SECRETARY_FROM ? "me" : "them",
          text: msg.text,
          time: msg.time,
        }))
      : selected
        ? localMessagesByConversation[selected.id] || []
        : []

  const getAutoReply = (role: string) => {
    if (role === "Provider") return "Received. I will share an update with Admin shortly."
    if (role === "Shopkeeper") return "Thanks. Please share the invoice reference and I will verify."
    if (role === "Agent") return "Noted. I will coordinate and get back to you shortly."
    if (role === "Sub-Admin") return "Thanks for forwarding this, I am checking it now."
    return "Thanks, message received."
  }

  const handleSend = () => {
    if (!message.trim() || !selected) return

    const outboundText = message
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    if (selected.role !== "Admin") {
      setLocalMessagesByConversation((prev) => {
        const current = prev[selected.id] || []
        return {
          ...prev,
          [selected.id]: [...current, { id: current.length + 1, sender: "me", text: outboundText, time: now }],
        }
      })

      setConversationState((prev) =>
        prev.map((conv) =>
          conv.id === selected.id
            ? {
                ...conv,
                lastMsg: outboundText,
                time: "Just now",
              }
            : conv,
        ),
      )

      const autoReply = getAutoReply(selected.role)
      const selectedId = selected.id
      setTimeout(() => {
        const replyTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        setLocalMessagesByConversation((prev) => {
          const current = prev[selectedId] || []
          return {
            ...prev,
            [selectedId]: [...current, { id: current.length + 1, sender: "them", text: autoReply, time: replyTime }],
          }
        })

        setConversationState((prev) =>
          prev.map((conv) =>
            conv.id === selectedId
              ? {
                  ...conv,
                  lastMsg: autoReply,
                  time: "Just now",
                }
              : conv,
          ),
        )
      }, 1200)

      setMessage("")
      return
    }

    const outgoingThreadItem: ThreadItem = {
      sender: SECRETARY_FROM,
      text: outboundText,
      time: now,
      type: "received",
    }

    const nextThread = [...adminThread, outgoingThreadItem]
    setAdminThread(nextThread)

    const inbox = readExternalInbox()
    const targetIndex = inbox.findIndex((item) => item.from === SECRETARY_FROM)
    const nextInbox = [...inbox]

    if (targetIndex >= 0) {
      const current = nextInbox[targetIndex]
      nextInbox[targetIndex] = {
        ...current,
        message: outboundText,
        time: "Just now",
        unread: true,
        replies: (current.replies || 0) + 1,
        category: current.category || "Internal",
        thread: nextThread,
      }
    } else {
      nextInbox.unshift({
        id: Date.now(),
        from: SECRETARY_FROM,
        message: outboundText,
        time: "Just now",
        unread: true,
        replies: 1,
        category: "Internal",
        thread: nextThread,
      })
    }

    writeExternalInbox(nextInbox)

    setConversationState((prev) =>
      prev.map((conv) =>
        conv.role === "Admin"
          ? {
              ...conv,
              lastMsg: outboundText,
              time: "Just now",
            }
          : conv,
      ),
    )

    setMessage("")
  }

  const handleCall = () => {
    if (!selected) return
    alert(`Calling ${selected.name}...`)
  }

  const handleConversationOptions = () => {
    if (!selected) return
    alert(`More options for ${selected.name} will be available here.`)
  }

  const handleAttachmentClick = () => {
    fileInputRef.current?.click()
  }

  const handleAttachmentSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const fileMsg = `Attached file: ${file.name}`
      setMessage((prev) => (prev ? `${prev} ${fileMsg}` : fileMsg))
    }
    event.target.value = ""
  }

  return (
    <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-5rem)]">
      <div className="flex h-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {/* Conversations List */}
        <div className={`w-full lg:w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col ${selectedChat ? "hidden lg:flex" : "flex"}`}>
          <div className="p-3 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Messages</h2>
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
              <Search size={14} className="text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations..." className="bg-transparent text-sm outline-none flex-1 text-gray-700 dark:text-gray-200 placeholder:text-gray-400" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
            {conversationState.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map(conv => (
              <button key={conv.id} onClick={() => setSelectedChat(conv.id)} className={`w-full text-left px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${selectedChat === conv.id ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}>
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{conv.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{conv.name}</p>
                      <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{conv.time}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{conv.lastMsg}</p>
                      {conv.unread > 0 && <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center flex-shrink-0 ml-2">{conv.unread}</span>}
                    </div>
                    <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${conv.role === "Admin" ? "bg-red-100 dark:bg-red-900/30 text-red-600" : conv.role === "Agent" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600" : conv.role === "Provider" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" : conv.role === "Sub-Admin" ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600" : "bg-blue-100 dark:bg-blue-900/30 text-blue-600"}`}>{conv.role}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${selectedChat ? "flex" : "hidden lg:flex"}`}>
          {selected ? (
            <>
              <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                <button onClick={() => setSelectedChat(null)} className="lg:hidden text-gray-600 dark:text-gray-300"><ArrowLeft size={20} /></button>
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">{selected.avatar}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{selected.name}</p>
                  <p className="text-[11px] text-emerald-500">Online</p>
                </div>
                <button onClick={handleCall} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"><Phone size={18} /></button>
                <button onClick={handleConversationOptions} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"><MoreVertical size={18} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {currentMessages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] lg:max-w-[65%] px-3 py-2 rounded-2xl ${msg.sender === "me" ? "bg-blue-600 text-white rounded-br-sm" : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm"}`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 ${msg.sender === "me" ? "text-blue-200" : "text-gray-400"}`}>
                        <span className="text-[10px]">{msg.time}</span>
                        {msg.sender === "me" && <CheckCheck size={12} />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <button onClick={handleAttachmentClick} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><Paperclip size={18} /></button>
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleAttachmentSelected} />
                  <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Type a message..." className="flex-1 bg-gray-100 dark:bg-gray-700 text-sm rounded-full px-4 py-2.5 outline-none text-gray-900 dark:text-white placeholder:text-gray-400" onKeyDown={e => { if (e.key === "Enter") handleSend() }} />
                  <Button size="sm" className="rounded-full w-9 h-9 p-0 bg-blue-600 hover:bg-blue-700" onClick={handleSend}><Send size={16} /></Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                  <Search size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
