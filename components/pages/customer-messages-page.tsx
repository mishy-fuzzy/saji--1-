"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useAuthContext } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Send, Search, Check, CheckCheck, Phone, Video, Paperclip, Smile, Mic, 
  ImageIcon, MapPin, MoreVertical, ArrowLeft, Camera, File, Play,
  Volume2, PhoneOff
} from "lucide-react"
import Image from "next/image"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Message {
  id: number; sender: "customer" | "provider"; text?: string
  type: "text" | "image" | "file" | "location" | "voice"; content?: string
  timestamp: string; status: "sent" | "delivered" | "read"; duration?: number; imageUrl?: string
}

interface Conversation {
  id: number; provider: string; lastMessage: string; timestamp: string
  unread: number; image: string; status: "online" | "offline" | "typing"; role: string
}

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
const CUSTOMER_FROM = "Customer"
const ADMIN_CONVERSATION_ID = 99

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

export function CustomerMessagesPage() {
  const { user } = useAuthContext()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedChat, setSelectedChat] = useState<number | null>(null)
  const [messageInput, setMessageInput] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [showCallModal, setShowCallModal] = useState(false)
  const [callType, setCallType] = useState<"voice" | "video" | null>(null)
  const [isCallActive, setIsCallActive] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const callTimerRef = useRef<NodeJS.Timeout | null>(null)

  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: "provider", text: "Hi! I received your booking request for the kitchen renovation.", type: "text", timestamp: "10:00 AM", status: "read" },
    { id: 2, sender: "provider", text: "I can start the work this Saturday. Does that work for you?", type: "text", timestamp: "10:02 AM", status: "read" },
    { id: 3, sender: "customer", text: "That sounds perfect! What time will you arrive?", type: "text", timestamp: "10:05 AM", status: "read" },
    { id: 4, sender: "provider", text: "I'll be there at 9 AM. I'll also bring some samples for you to look at.", type: "text", timestamp: "10:08 AM", status: "read" },
    { id: 5, sender: "provider", type: "image", content: "Cabinet samples", imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=200&fit=crop", timestamp: "10:10 AM", status: "read" },
    { id: 6, sender: "customer", text: "These look great! I love the oak finish.", type: "text", timestamp: "10:15 AM", status: "read" },
    { id: 7, sender: "provider", text: "Perfect choice! See you Saturday then.", type: "text", timestamp: "10:18 AM", status: "delivered" },
  ])

  const [conversations, setConversations] = useState<Conversation[]>([
    { id: 1, provider: "Sarah Chen", lastMessage: "Perfect choice! See you Saturday then.", timestamp: "10:18 AM", unread: 2, image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", status: "online", role: "Kitchen Specialist" },
    { id: 2, provider: "John Peters", lastMessage: "The plumbing work is complete.", timestamp: "Yesterday", unread: 0, image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", status: "offline", role: "Plumber" },
    { id: 3, provider: "Mike Thompson", lastMessage: "I'll send the quote shortly.", timestamp: "Yesterday", unread: 0, image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop", status: "online", role: "Electrician" },
    { id: 4, provider: "Grace Wanjiru", lastMessage: "Thank you for the 5-star review!", timestamp: "2 days ago", unread: 0, image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop", status: "offline", role: "House Cleaner" },
    { id: 5, provider: "David Ochieng", lastMessage: "Materials have been delivered.", timestamp: "3 days ago", unread: 0, image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop", status: "typing", role: "Painter" },
    { id: ADMIN_CONVERSATION_ID, provider: "Admin Office", lastMessage: "Message us for escalations and account support.", timestamp: "Now", unread: 0, image: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop", status: "online", role: "Admin" },
  ])

  const [adminThread, setAdminThread] = useState<Message[]>([])

  const emojis = ["thumbsup", "heart", "fire", "star", "wave", "clap", "check", "100", "sparkle", "pray", "muscle", "smile"]
  const emojiMap: Record<string, string> = { thumbsup: "\uD83D\uDC4D", heart: "\u2764\uFE0F", fire: "\uD83D\uDD25", star: "\u2B50", wave: "\uD83D\uDC4B", clap: "\uD83D\uDC4F", check: "\u2705", "100": "\uD83D\uDCAF", sparkle: "\u2728", pray: "\uD83D\uDE4F", muscle: "\uD83D\uDCAA", smile: "\uD83D\uDE0A" }

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }
  const displayedMessages = selectedChat === ADMIN_CONVERSATION_ID ? adminThread : messages
  useEffect(() => { scrollToBottom() }, [displayedMessages])

  useEffect(() => {
    const syncCustomerThread = () => {
      const inbox = readExternalInbox()
      const customerEntry = inbox.find((item) => item.from === CUSTOMER_FROM)
      if (!customerEntry) return

      const thread = Array.isArray(customerEntry.thread)
        ? customerEntry.thread.map((item, index) => ({
            id: index + 1,
            sender: item.sender === CUSTOMER_FROM ? "customer" : "provider",
            text: item.text,
            type: "text",
            timestamp: item.time,
            status: "read",
          } as Message))
        : []

      setAdminThread(thread)
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === ADMIN_CONVERSATION_ID
            ? {
                ...conv,
                lastMessage: customerEntry.message || conv.lastMessage,
                timestamp: customerEntry.time || conv.timestamp,
              }
            : conv,
        ),
      )
    }

    syncCustomerThread()
    window.addEventListener("storage", syncCustomerThread)
    return () => window.removeEventListener("storage", syncCustomerThread)
  }, [])

  const filteredConversations = conversations.filter(conv => conv.provider.toLowerCase().includes(searchQuery.toLowerCase()))
  const selectedConversation = conversations.find(c => c.id === selectedChat)

  const handleSendMessage = (type: "text" | "image" | "file" | "location" | "voice" = "text", content?: string, imageUrl?: string) => {
    if (selectedChat === ADMIN_CONVERSATION_ID) {
      const outboundText = (type === "text" ? messageInput : content || messageInput).trim()
      if (!outboundText) return

      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      const nextAdminThread: Message[] = [
        ...adminThread,
        { id: adminThread.length + 1, sender: "customer", text: outboundText, type: "text", timestamp: now, status: "sent" },
      ]
      setAdminThread(nextAdminThread)

      const inbox = readExternalInbox()
      const targetIndex = inbox.findIndex((item) => item.from === CUSTOMER_FROM)
      const nextInbox = [...inbox]
      const threadPayload: ThreadItem[] = nextAdminThread.map((item) => ({
        sender: item.sender === "customer" ? CUSTOMER_FROM : "Admin",
        text: item.text || "",
        time: item.timestamp,
        type: item.sender === "customer" ? "received" : "sent",
      }))

      if (targetIndex >= 0) {
        const current = nextInbox[targetIndex]
        nextInbox[targetIndex] = {
          ...current,
          message: outboundText,
          time: "Just now",
          unread: true,
          replies: (current.replies || 0) + 1,
          category: current.category || "Internal",
          thread: threadPayload,
        }
      } else {
        nextInbox.unshift({
          id: Date.now(),
          from: CUSTOMER_FROM,
          message: outboundText,
          time: "Just now",
          unread: true,
          replies: 1,
          category: "Internal",
          thread: threadPayload,
        })
      }

      writeExternalInbox(nextInbox)
      setConversations((prev) => prev.map((conv) => conv.id === ADMIN_CONVERSATION_ID ? { ...conv, lastMessage: outboundText, timestamp: "Just now" } : conv))
      setMessageInput("")
      setShowAttachMenu(false)
      return
    }

    if ((type === "text" && messageInput.trim()) || type !== "text") {
      const newMessage: Message = { id: messages.length + 1, sender: "customer", text: type === "text" ? messageInput : undefined, type, content: type !== "text" ? content : undefined, imageUrl, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), status: "sent" }
      setMessages([...messages, newMessage])
      if (type === "text") setMessageInput("")
      setShowAttachMenu(false)
      setTimeout(() => { setMessages(prev => prev.map(msg => msg.id === newMessage.id ? { ...msg, status: "delivered" } : msg)) }, 1000)
      setTimeout(() => { setMessages(prev => prev.map(msg => msg.id === newMessage.id ? { ...msg, status: "read" } : msg)) }, 2500)
    }
  }

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      setRecordingTime(0)
      recordingIntervalRef.current = setInterval(() => { setRecordingTime(prev => prev + 1) }, 1000)
      mediaRecorder.ondataavailable = (event) => { audioChunksRef.current.push(event.data) }
      mediaRecorder.onstop = () => {
        const minutes = Math.floor(recordingTime / 60); const seconds = recordingTime % 60
        handleSendMessage("voice", `Voice message (${minutes}:${seconds.toString().padStart(2, '0')})`)
        stream.getTracks().forEach(track => track.stop())
        if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current)
      }
      mediaRecorder.start(); setIsRecording(true)
    } catch { alert("Please allow microphone access") }
  }

  const handleStopRecording = () => { if (mediaRecorderRef.current) { mediaRecorderRef.current.stop(); setIsRecording(false) } }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) handleSendMessage("file", `${file.name} (${(file.size / 1024).toFixed(1)} KB)`); e.target.value = '' }
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { handleSendMessage("image", file.name, reader.result as string) }; reader.readAsDataURL(file) }; e.target.value = '' }
  const handleShareLocation = () => { if (navigator.geolocation) { navigator.geolocation.getCurrentPosition((position) => { handleSendMessage("location", `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`); setShowAttachMenu(false) }, () => alert("Enable location access")) } }

  const getStatusIcon = (status: "sent" | "delivered" | "read") => {
    if (status === "read") return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
    if (status === "delivered") return <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />
    return <Check className="w-3.5 h-3.5 text-muted-foreground" />
  }

  const handleStartCall = (type: "voice" | "video") => { setCallType(type); setShowCallModal(true); setCallDuration(0); setTimeout(() => { setIsCallActive(true); callTimerRef.current = setInterval(() => { setCallDuration(prev => prev + 1) }, 1000) }, 2000) }
  const handleEndCall = () => { if (callTimerRef.current) clearInterval(callTimerRef.current); setIsCallActive(false); setShowCallModal(false); setCallType(null); setCallDuration(0) }
  const formatCallTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`

  const handleMoreMenuAction = (action: string) => {
    switch(action) { case "block": alert("User blocked"); break; case "mute": alert("Notifications muted"); break; case "report": alert("Report submitted"); break; case "clear": setMessages([]); break }
    setShowMoreMenu(false)
  }

  const renderMessage = (message: Message) => {
    const isCustomer = message.sender === "customer"
    return (
      <div key={message.id} className={`flex ${isCustomer ? "justify-end" : "justify-start"} mb-2`}>
        <div className={`max-w-[75%]`}>
          <div className={`rounded-2xl px-3.5 py-2 ${isCustomer ? "bg-primary text-primary-foreground rounded-br-lg" : "bg-card border border-border rounded-bl-lg shadow-sm"}`}>
            {message.type === "text" && <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>}
            {message.type === "image" && (
              <div className="space-y-1.5">
                <div className="relative w-48 h-36 rounded-xl overflow-hidden"><Image src={message.imageUrl || "/placeholder.svg"} alt={message.content || "Image"} fill className="object-cover" /></div>
                {message.content && <p className="text-xs opacity-80">{message.content}</p>}
              </div>
            )}
            {message.type === "file" && (
              <div className="flex items-center gap-2.5 p-2 bg-background/10 rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0"><File className="w-4 h-4 text-white" /></div>
                <p className="text-sm font-medium truncate">{message.content}</p>
              </div>
            )}
            {message.type === "voice" && (
              <div className="flex items-center gap-2.5 min-w-[160px]">
                <button className="w-9 h-9 rounded-full bg-background/20 flex items-center justify-center hover:bg-background/30 transition-colors flex-shrink-0"><Play className="w-4 h-4" /></button>
                <div className="flex-1"><div className="h-1 bg-background/30 rounded-full"><div className="h-full w-0 bg-current rounded-full" /></div><p className="text-[10px] mt-0.5 opacity-70">{message.content}</p></div>
              </div>
            )}
            {message.type === "location" && (
              <div className="space-y-1.5"><div className="w-48 h-28 rounded-xl bg-emerald-600/20 flex items-center justify-center"><div className="text-center"><MapPin className="w-6 h-6 mx-auto mb-0.5" /><p className="text-xs font-medium">Location Shared</p></div></div><p className="text-[10px] opacity-70">{message.content}</p></div>
            )}
            <div className={`flex items-center gap-1 mt-1 ${isCustomer ? "justify-end" : "justify-start"}`}>
              <span className="text-[10px] opacity-60">{message.timestamp}</span>
              {isCustomer && getStatusIcon(message.status)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] lg:h-screen bg-background">
      {/* Conversations Sidebar */}
      <div className={`w-full lg:w-[380px] border-r border-border flex flex-col ${selectedChat !== null ? "hidden lg:flex" : "flex"}`}>
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold text-foreground mb-3">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search conversations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-muted/50 border-0 rounded-xl h-10" />
          </div>
        </div>

        {/* Online Now */}
        <div className="px-4 py-3 border-b border-border/50">
          <p className="text-[11px] font-semibold text-muted-foreground mb-2.5 tracking-wider">ONLINE NOW</p>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {conversations.filter(c => c.status === "online").map(conv => (
              <button key={conv.id} onClick={() => setSelectedChat(conv.id)} className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="relative">
                  <Image src={conv.image || "/placeholder.svg"} alt={conv.provider} width={44} height={44} className="rounded-full object-cover ring-2 ring-emerald-400 ring-offset-2 ring-offset-background" />
                </div>
                <span className="text-[10px] text-muted-foreground truncate w-12 text-center">{conv.provider.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map(conv => (
            <button key={conv.id} onClick={() => setSelectedChat(conv.id)}
              className={`w-full px-4 py-3 flex gap-3 hover:bg-muted/40 transition-colors border-b border-border/30 ${selectedChat === conv.id ? "bg-muted/60" : ""}`}
            >
              <div className="relative flex-shrink-0">
                <Image src={conv.image || "/placeholder.svg"} alt={conv.provider} width={48} height={48} className="rounded-full object-cover" />
                {conv.status === "online" && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-background" />}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="font-semibold text-sm text-foreground">{conv.provider}</h3>
                  <span className="text-[11px] text-muted-foreground">{conv.timestamp}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mb-0.5">{conv.role}</p>
                <div className="flex items-center justify-between">
                  <p className={`text-sm truncate ${conv.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {conv.status === "typing" ? <span className="text-primary italic text-xs">typing...</span> : conv.lastMessage}
                  </p>
                  {conv.unread > 0 && <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-bold">{conv.unread}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${selectedChat === null ? "hidden lg:flex" : "flex"}`}>
        {selectedChat && selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="px-4 py-2.5 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedChat(null)} className="lg:hidden p-1.5 -ml-1 hover:bg-muted rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
                <Image src={selectedConversation.image || "/placeholder.svg"} alt="" width={36} height={36} className="rounded-full object-cover" />
                <div>
                  <h2 className="font-semibold text-sm text-foreground">{selectedConversation.provider}</h2>
                  <p className="text-[11px] text-muted-foreground">
                    {selectedConversation.status === "online" ? <span className="text-emerald-600 dark:text-emerald-400">Online</span> : selectedConversation.status === "typing" ? <span className="text-primary">typing...</span> : "Offline"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <button onClick={() => handleStartCall("voice")} className="p-2 hover:bg-muted rounded-lg transition-colors"><Phone className="w-4 h-4 text-muted-foreground" /></button>
                <button onClick={() => handleStartCall("video")} className="p-2 hover:bg-muted rounded-lg transition-colors"><Video className="w-4 h-4 text-muted-foreground" /></button>
                <Popover open={showMoreMenu} onOpenChange={setShowMoreMenu}>
                  <PopoverTrigger asChild><button className="p-2 hover:bg-muted rounded-lg transition-colors"><MoreVertical className="w-4 h-4 text-muted-foreground" /></button></PopoverTrigger>
                  <PopoverContent align="end" className="w-44 p-1 rounded-xl">
                    <button onClick={() => handleMoreMenuAction("mute")} className="w-full px-3 py-2 text-sm hover:bg-muted rounded-lg text-left">Mute</button>
                    <button onClick={() => handleMoreMenuAction("block")} className="w-full px-3 py-2 text-sm hover:bg-muted rounded-lg text-left">Block</button>
                    <button onClick={() => handleMoreMenuAction("clear")} className="w-full px-3 py-2 text-sm hover:bg-muted rounded-lg text-left">Clear chat</button>
                    <button onClick={() => handleMoreMenuAction("report")} className="w-full px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-left text-red-600 dark:text-red-400">Report</button>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-muted/20">
              <div className="text-center mb-4"><span className="text-[11px] text-muted-foreground bg-muted/80 px-3 py-1 rounded-full">Today</span></div>
              {displayedMessages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border bg-card">
              {showEmojiPicker && (
                <div className="mb-2.5 p-2.5 bg-muted/60 rounded-xl">
                  <div className="flex flex-wrap gap-1.5">
                    {emojis.map(key => (
                      <button key={key} onClick={() => { setMessageInput(prev => prev + emojiMap[key]); setShowEmojiPicker(false) }} className="text-xl w-9 h-9 rounded-lg hover:bg-background flex items-center justify-center transition-colors">{emojiMap[key]}</button>
                    ))}
                  </div>
                </div>
              )}

              {showAttachMenu && (
                <div className="mb-2.5 p-2.5 bg-muted/60 rounded-xl">
                  <div className="grid grid-cols-4 gap-2">
                    <button onClick={() => imageInputRef.current?.click()} className="flex flex-col items-center gap-1 p-2.5 hover:bg-background rounded-xl transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center"><ImageIcon className="w-5 h-5 text-white" /></div>
                      <span className="text-[10px] text-muted-foreground">Gallery</span>
                    </button>
                    <button onClick={() => imageInputRef.current?.click()} className="flex flex-col items-center gap-1 p-2.5 hover:bg-background rounded-xl transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-pink-500 flex items-center justify-center"><Camera className="w-5 h-5 text-white" /></div>
                      <span className="text-[10px] text-muted-foreground">Camera</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-1 p-2.5 hover:bg-background rounded-xl transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center"><File className="w-5 h-5 text-white" /></div>
                      <span className="text-[10px] text-muted-foreground">File</span>
                    </button>
                    <button onClick={handleShareLocation} className="flex flex-col items-center gap-1 p-2.5 hover:bg-background rounded-xl transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center"><MapPin className="w-5 h-5 text-white" /></div>
                      <span className="text-[10px] text-muted-foreground">Location</span>
                    </button>
                  </div>
                </div>
              )}

              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.txt,.xlsx" />
              <input type="file" ref={imageInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />

              {isRecording ? (
                <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-2.5">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="flex-1 text-red-600 dark:text-red-400 text-sm font-medium">Recording {formatTime(recordingTime)}</span>
                  <button onClick={handleStopRecording} className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"><Send className="w-4 h-4" /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => { setShowAttachMenu(!showAttachMenu); setShowEmojiPicker(false) }} className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"><Paperclip className="w-5 h-5 text-muted-foreground" /></button>
                  <div className="flex-1 relative">
                    <Input value={messageInput} onChange={(e) => setMessageInput(e.target.value)} placeholder="Type a message..." className="pr-10 rounded-xl bg-muted/50 border-0 h-10" onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()} />
                    <button onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowAttachMenu(false) }} className="absolute right-3 top-1/2 -translate-y-1/2"><Smile className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /></button>
                  </div>
                  {messageInput.trim() ? (
                    <button onClick={() => handleSendMessage()} className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors flex-shrink-0"><Send className="w-4 h-4" /></button>
                  ) : (
                    <button onClick={handleStartRecording} className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors flex-shrink-0"><Mic className="w-4 h-4" /></button>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/10">
            <div className="text-center p-8">
              <div className="w-20 h-20 bg-muted/60 rounded-2xl flex items-center justify-center mx-auto mb-4"><Send className="w-8 h-8 text-muted-foreground" /></div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Your Messages</h3>
              <p className="text-sm text-muted-foreground max-w-xs">Select a conversation to start chatting with service providers.</p>
            </div>
          </div>
        )}
      </div>

      {/* Call Modal */}
      <Dialog open={showCallModal} onOpenChange={setShowCallModal}>
        <DialogContent className="max-w-sm rounded-2xl">
          <div className="flex flex-col items-center justify-center py-8">
            {!isCallActive ? (
              <>
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-5">
                  {callType === "video" ? <Video className="w-9 h-9 text-primary-foreground" /> : <Phone className="w-9 h-9 text-primary-foreground" />}
                </div>
                <h3 className="text-lg font-semibold mb-1">{callType === "video" ? "Video Call" : "Voice Call"}</h3>
                <p className="text-muted-foreground text-sm mb-1">{selectedConversation?.provider}</p>
                <p className="text-xs text-muted-foreground mb-6">Connecting...</p>
                <Button onClick={handleEndCall} className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 p-0"><PhoneOff className="w-5 h-5 text-white" /></Button>
              </>
            ) : (
              <>
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-5">
                  {callType === "video" ? <Video className="w-12 h-12 text-primary-foreground" /> : <Phone className="w-12 h-12 text-primary-foreground" />}
                </div>
                <h3 className="text-base font-semibold">{selectedConversation?.provider}</h3>
                <p className="text-2xl font-mono font-bold text-primary my-3">{formatCallTime(callDuration)}</p>
                <div className="flex gap-3 mb-5">
                  <Button className="w-11 h-11 rounded-full bg-muted hover:bg-muted/80 p-0" title="Mute"><Mic className="w-5 h-5 text-foreground" /></Button>
                  {callType === "video" && <Button className="w-11 h-11 rounded-full bg-muted hover:bg-muted/80 p-0" title="Camera"><Camera className="w-5 h-5 text-foreground" /></Button>}
                  <Button className="w-11 h-11 rounded-full bg-muted hover:bg-muted/80 p-0" title="Speaker"><Volume2 className="w-5 h-5 text-foreground" /></Button>
                </div>
                <Button onClick={handleEndCall} className="w-13 h-13 rounded-full bg-red-600 hover:bg-red-700 p-0"><PhoneOff className="w-6 h-6 text-white" /></Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
