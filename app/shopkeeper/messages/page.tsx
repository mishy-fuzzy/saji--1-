"use client"

import { useState, useRef, useEffect } from "react"
import { 
  Search, Phone, Video, MoreVertical, Send, Paperclip, ImageIcon, ArrowLeft,
  Check, CheckCheck
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from "next/image"

interface Message {
  id: number
  sender: "customer" | "shopkeeper"
  text: string
  time: string
  status: "sent" | "delivered" | "read"
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
const SHOPKEEPER_FROM = "Shopkeeper"
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

export default function ShopkeeperMessagesPage() {
  const [activeChat, setActiveChat] = useState<number | null>(1)
  const [messageInput, setMessageInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showCallDialog, setShowCallDialog] = useState(false)
  const [callType, setCallType] = useState<"voice" | "video" | null>(null)
  const [isCallActive, setIsCallActive] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const callTimerRef = useRef<NodeJS.Timeout | null>(null)

  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: "customer", text: "Hi, I'm interested in the Samsung TV 55 inches", time: "10:30 AM", status: "read" },
    { id: 2, sender: "shopkeeper", text: "Hi John! Great choice. That model is currently in stock.", time: "10:32 AM", status: "read" },
    { id: 3, sender: "customer", text: "What's the best price you can offer?", time: "10:35 AM", status: "read" },
    { id: 4, sender: "shopkeeper", text: "The price is KES 65,000. I can also offer free delivery within Nairobi.", time: "10:37 AM", status: "read" },
    { id: 5, sender: "customer", text: "Perfect! Can you deliver today?", time: "10:40 AM", status: "read" },
    { id: 6, sender: "shopkeeper", text: "Yes, we can deliver by 5 PM today. Would that work?", time: "10:42 AM", status: "read" },
  ])

  const [conversations, setConversations] = useState([
    {
      id: 1,
      name: "John Kamau",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      lastMessage: "Perfect! Can you deliver today?",
      time: "2 min ago",
      unread: 0,
      online: true,
      lastOrder: "Samsung TV 55\" - KES 65,000"
    },
    {
      id: 2,
      name: "Sarah Wanjiku",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      lastMessage: "Thanks for the fast delivery!",
      time: "1 hour ago",
      unread: 0,
      online: true,
      lastOrder: "LG Refrigerator - KES 89,000"
    },
    {
      id: 3,
      name: "Peter Ochieng",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
      lastMessage: "Is the product still available?",
      time: "5 hours ago",
      unread: 1,
      online: false,
      lastOrder: "Bosch Washing Machine - KES 45,000"
    },
    {
      id: 4,
      name: "Grace Muthoni",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      lastMessage: "What are the payment options?",
      time: "Yesterday",
      unread: 0,
      online: false,
      lastOrder: "Sony Home Theater - KES 32,000"
    },
    {
      id: ADMIN_CONVERSATION_ID,
      name: "Admin Office",
      avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop",
      lastMessage: "Contact us for disputes, payouts, and escalation.",
      time: "Now",
      unread: 0,
      online: true,
      lastOrder: "Internal Support"
    }
  ])

  const [adminThread, setAdminThread] = useState<Message[]>([])

  const selectedChat = conversations.find(c => c.id === activeChat)
  const displayedMessages = activeChat === ADMIN_CONVERSATION_ID ? adminThread : messages

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastOrder.toLowerCase().includes(searchQuery.toLowerCase())
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [displayedMessages])

  useEffect(() => {
    const syncShopkeeperThread = () => {
      const inbox = readExternalInbox()
      const shopkeeperEntry = inbox.find((item) => item.from === SHOPKEEPER_FROM)
      if (!shopkeeperEntry) return

      const thread = Array.isArray(shopkeeperEntry.thread)
        ? shopkeeperEntry.thread.map((item, index) => ({
            id: index + 1,
            sender: item.sender === SHOPKEEPER_FROM ? "shopkeeper" : "customer",
            text: item.text,
            time: item.time,
            status: "read",
          } as Message))
        : []

      setAdminThread(thread)
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === ADMIN_CONVERSATION_ID
            ? {
                ...conv,
                lastMessage: shopkeeperEntry.message || conv.lastMessage,
                time: shopkeeperEntry.time || conv.time,
              }
            : conv,
        ),
      )
    }

    syncShopkeeperThread()
    window.addEventListener("storage", syncShopkeeperThread)
    return () => window.removeEventListener("storage", syncShopkeeperThread)
  }, [])

  const handleSendMessage = () => {
    if (activeChat === ADMIN_CONVERSATION_ID) {
      const outboundText = messageInput.trim()
      if (!outboundText) return

      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      const nextAdminThread: Message[] = [
        ...adminThread,
        { id: adminThread.length + 1, sender: "shopkeeper", text: outboundText, time: now, status: "sent" },
      ]
      setAdminThread(nextAdminThread)

      const inbox = readExternalInbox()
      const targetIndex = inbox.findIndex((item) => item.from === SHOPKEEPER_FROM)
      const nextInbox = [...inbox]
      const threadPayload: ThreadItem[] = nextAdminThread.map((item) => ({
        sender: item.sender === "shopkeeper" ? SHOPKEEPER_FROM : "Admin",
        text: item.text,
        time: item.time,
        type: item.sender === "shopkeeper" ? "received" : "sent",
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
          from: SHOPKEEPER_FROM,
          message: outboundText,
          time: "Just now",
          unread: true,
          replies: 1,
          category: "Internal",
          thread: threadPayload,
        })
      }

      writeExternalInbox(nextInbox)
      setConversations((prev) => prev.map((conv) => conv.id === ADMIN_CONVERSATION_ID ? { ...conv, lastMessage: outboundText, time: "Just now" } : conv))
      setMessageInput("")
      return
    }

    if (messageInput.trim()) {
      const newMessage: Message = {
        id: messages.length + 1,
        sender: "shopkeeper",
        text: messageInput,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "sent",
      }
      setMessages([...messages, newMessage])
      setMessageInput("")

      setTimeout(() => {
        setMessages(prev => prev.map(msg => msg.id === newMessage.id ? { ...msg, status: "delivered" } : msg))
      }, 1000)

      setTimeout(() => {
        setMessages(prev => prev.map(msg => msg.id === newMessage.id ? { ...msg, status: "read" } : msg))
      }, 2500)
    }
  }

  const handleStartCall = (type: "voice" | "video") => {
    setCallType(type)
    setShowCallDialog(true)
    setCallDuration(0)
    
    setTimeout(() => {
      setIsCallActive(true)
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    }, 2000)
  }

  const handleEndCall = () => {
    if (callTimerRef.current) clearInterval(callTimerRef.current)
    setIsCallActive(false)
    setShowCallDialog(false)
    setCallType(null)
    setCallDuration(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto flex h-screen lg:h-[calc(100vh-2rem)] lg:my-4 lg:rounded-2xl overflow-hidden shadow-xl">
        {/* Conversations List */}
        <div className={`w-full lg:w-96 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col ${activeChat ? 'hidden lg:flex' : 'flex'}`}>
          {/* Header */}
          <div className="p-4 border-b dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search conversations..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <button className="flex-1 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg">All</button>
            <button className="flex-1 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Unread</button>
            <button className="flex-1 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Pending</button>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveChat(conv.id)}
                className={`w-full p-4 flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left border-b dark:border-gray-700 last:border-0 ${
                  activeChat === conv.id ? "bg-amber-50 dark:bg-amber-900/20" : ""
                }`}
              >
                <div className="relative flex-shrink-0">
                  <Image 
                    src={conv.avatar || "/placeholder.svg"} 
                    alt={conv.name}
                    width={48}
                    height={48}
                    className="rounded-full object-cover w-12 h-12"
                  />
                  {conv.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{conv.name}</h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{conv.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mb-1">{conv.lastMessage}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-amber-600 dark:text-amber-400 truncate">{conv.lastOrder}</span>
                    {conv.unread > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-2">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 ${activeChat ? 'flex' : 'hidden lg:flex'}`}>
          {activeChat && selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveChat(null)}
                    className="lg:hidden p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="relative flex-shrink-0">
                    <Image 
                      src={selectedChat.avatar || "/placeholder.svg"}
                      alt={selectedChat.name}
                      width={44}
                      height={44}
                      className="rounded-full object-cover w-11 h-11"
                    />
                    {selectedChat.online && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-gray-900 dark:text-white">{selectedChat.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {selectedChat.online ? "Online now" : "Last active 3 hours ago"} • Order: {selectedChat.lastOrder.split(' - ')[0]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="hidden sm:flex"
                    onClick={() => handleStartCall("voice")}
                  >
                    <Phone className="w-5 h-5 text-amber-600" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="hidden sm:flex"
                    onClick={() => handleStartCall("video")}
                  >
                    <Video className="w-5 h-5 text-amber-600" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Order Details</DropdownMenuItem>
                      <DropdownMenuItem>View Customer Profile</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Block Customer</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {displayedMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "shopkeeper" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs px-4 py-2 rounded-2xl ${
                      msg.sender === "shopkeeper" 
                        ? "bg-amber-600 text-white rounded-br-none" 
                        : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none"
                    }`}>
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                      <div className={`flex items-center gap-1 mt-1 ${msg.sender === "shopkeeper" ? "justify-end" : "justify-start"}`}>
                        <span className="text-[10px] opacity-70">{msg.time}</span>
                        {msg.sender === "shopkeeper" && (
                          msg.status === "read" ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
                <div className="flex items-end gap-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Paperclip className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
                  />
                  <button 
                    onClick={() => imageInputRef.current?.click()}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ImageIcon className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <input 
                    type="file" 
                    ref={imageInputRef} 
                    className="hidden"
                    accept="image/*"
                  />
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 rounded-full"
                  />
                  <Button
                    onClick={handleSendMessage}
                    className="bg-amber-600 hover:bg-amber-700 rounded-full p-2 w-10 h-10"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>

      {/* Call Dialog */}
      <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
        <DialogContent className="max-w-sm border-0">
          <div className="flex flex-col items-center gap-6 py-8">
            <Image 
              src={selectedChat?.avatar || "/placeholder.svg"} 
              alt={selectedChat?.name || "Customer"}
              width={80}
              height={80}
              className="rounded-full object-cover w-20 h-20"
            />
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedChat?.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {isCallActive ? formatTime(callDuration) : "Connecting..."}
              </p>
            </div>

            {isCallActive && (
              <div className="flex gap-4">
                <Button 
                  variant="outline"
                  size="icon"
                  className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700"
                >
                  <Phone className="w-5 h-5 rotate-90" />
                </Button>
                <Button 
                  onClick={handleEndCall}
                  className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600"
                >
                  <Phone className="w-5 h-5 text-white" />
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
