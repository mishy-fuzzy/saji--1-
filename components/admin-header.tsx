"use client"

import { useLocalization } from "@/lib/hooks/useLocalization"
import { Bell, Search, MessageSquare, Sun, Moon, LogOut, Settings, Palette, BellIcon, X, CheckCircle, AlertCircle, User } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useAuthContext } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

type HeaderNotification = {
  id: number
  type: "user" | "warning" | "success" | "info"
  title: string
  message: string
  time: string
  read: boolean
}

type HeaderMessage = {
  id: number
  sender: string
  message: string
  time: string
  unread: boolean
}

type StoredMessageSummary = {
  id: number
  from: string
  message: string
  time: string
  unread: boolean
}

type StoredExternalInboxItem = {
  id: number
  from: string
  message: string
  time: string
  unread: boolean
}

const ADMIN_INBOX_STORAGE_KEY = "saji-admin-inbox"
const ADMIN_MESSAGES_STORAGE_KEY = "saji-admin-messages"
const ADMIN_MESSAGES_UPDATED_EVENT = "saji-admin-messages-updated"

export function AdminHeader() {
  const { currency, setCurrency, theme, setTheme } = useLocalization()
  const { logout } = useAuthContext()
  const router = useRouter()
  const [isDark, setIsDark] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showMessages, setShowMessages] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<HTMLDivElement>(null)

  const [notifications, setNotifications] = useState<HeaderNotification[]>([
    { id: 1, type: "user", title: "New user registered", message: "John Doe just signed up", time: "5 mins ago", read: false },
    { id: 2, type: "warning", title: "Dispute reported", message: "Payment dispute on order #2547", time: "12 mins ago", read: false },
    { id: 3, type: "success", title: "Task completed", message: "Mobile app development completed", time: "1 hour ago", read: true },
    { id: 4, type: "info", title: "System update", message: "Platform maintenance scheduled", time: "2 hours ago", read: true },
  ])
  const [messages, setMessages] = useState<HeaderMessage[]>([])

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark")
    setIsDark(isDarkMode)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (messagesRef.current && !messagesRef.current.contains(event.target as Node)) {
        setShowMessages(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const hydrateMessages = () => {
      let localMessages: StoredMessageSummary[] = []
      let externalInbox: StoredExternalInboxItem[] = []

      try {
        const rawLocal = window.localStorage.getItem(ADMIN_MESSAGES_STORAGE_KEY)
        const parsedLocal = rawLocal ? JSON.parse(rawLocal) : []
        localMessages = Array.isArray(parsedLocal) ? (parsedLocal as StoredMessageSummary[]) : []
      } catch {
        localMessages = []
      }

      try {
        const rawExternal = window.localStorage.getItem(ADMIN_INBOX_STORAGE_KEY)
        const parsedExternal = rawExternal ? JSON.parse(rawExternal) : []
        externalInbox = Array.isArray(parsedExternal) ? (parsedExternal as StoredExternalInboxItem[]) : []
      } catch {
        externalInbox = []
      }

      const mergedById = new Map<number, HeaderMessage>()

      for (const item of localMessages) {
        mergedById.set(item.id, {
          id: item.id,
          sender: item.from,
          message: item.message,
          time: item.time,
          unread: item.unread,
        })
      }

      for (const item of externalInbox) {
        const existing = mergedById.get(item.id)
        if (!existing) {
          mergedById.set(item.id, {
            id: item.id,
            sender: item.from,
            message: item.message,
            time: item.time,
            unread: item.unread,
          })
          continue
        }

        mergedById.set(item.id, {
          ...existing,
          sender: item.from || existing.sender,
          message: item.message || existing.message,
          time: item.time || existing.time,
          unread: existing.unread || item.unread,
        })
      }

      const unreadOnly = Array.from(mergedById.values()).filter((m) => m.unread)
      setMessages(unreadOnly)
    }

    hydrateMessages()
    window.addEventListener("storage", hydrateMessages)
    window.addEventListener(ADMIN_MESSAGES_UPDATED_EVENT, hydrateMessages)
    return () => {
      window.removeEventListener("storage", hydrateMessages)
      window.removeEventListener(ADMIN_MESSAGES_UPDATED_EVENT, hydrateMessages)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    setIsDark(newTheme === "dark")
  }

  const handleLogout = () => {
    logout()
    setShowProfileMenu(false)
    router.push("/")
  }

  const markMessageAsRead = (messageId: number) => {
    try {
      const rawLocal = window.localStorage.getItem(ADMIN_MESSAGES_STORAGE_KEY)
      const parsedLocal = rawLocal ? JSON.parse(rawLocal) : []
      if (Array.isArray(parsedLocal)) {
        const nextLocal = parsedLocal.map((item) =>
          item.id === messageId ? { ...item, unread: false } : item
        )
        window.localStorage.setItem(ADMIN_MESSAGES_STORAGE_KEY, JSON.stringify(nextLocal))
      }
    } catch {
      // Ignore storage errors.
    }

    try {
      const rawExternal = window.localStorage.getItem(ADMIN_INBOX_STORAGE_KEY)
      const parsedExternal = rawExternal ? JSON.parse(rawExternal) : []
      if (Array.isArray(parsedExternal)) {
        const nextExternal = parsedExternal.map((item) =>
          item.id === messageId ? { ...item, unread: false } : item
        )
        window.localStorage.setItem(ADMIN_INBOX_STORAGE_KEY, JSON.stringify(nextExternal))
      }
    } catch {
      // Ignore storage errors.
    }

    setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
    window.dispatchEvent(new Event(ADMIN_MESSAGES_UPDATED_EVENT))
  }

  const unreadSystemNotifications = notifications.filter((n) => !n.read)
  const unreadMessageNotifications = messages.map((m) => ({
    id: Number(`9${m.id}`),
    type: "info" as const,
    title: `Unread message from ${m.sender}`,
    message: m.message,
    time: m.time,
    read: false,
    messageId: m.id,
  }))
  const unreadNotificationsList = [...unreadSystemNotifications, ...unreadMessageNotifications]

  const unreadNotifications = unreadNotificationsList.length
  const unreadMessages = messages.length

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-8 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications)
                setShowMessages(false)
              }}
              className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Bell size={20} className="text-gray-600 dark:text-gray-300" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">{unreadNotifications}</span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  <button onClick={() => setShowNotifications(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <X size={18} />
                  </button>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {unreadNotificationsList.length === 0 && (
                    <div className="p-4 text-sm text-gray-500 dark:text-gray-400">No unread notifications</div>
                  )}
                  {unreadNotificationsList.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => {
                        if ("messageId" in notif) {
                          markMessageAsRead(notif.messageId)
                          setShowNotifications(false)
                          router.push(`/admin/messages?messageId=${notif.messageId}`)
                          return
                        }

                        setNotifications((prev) => prev.map((item) => (item.id === notif.id ? { ...item, read: true } : item)))
                      }}
                      className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors bg-blue-50 dark:bg-blue-900/20"
                    >
                      <div className="flex gap-3">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${
                          notif.type === "user" ? "bg-blue-100 dark:bg-blue-900/30" :
                          notif.type === "warning" ? "bg-yellow-100 dark:bg-yellow-900/30" :
                          notif.type === "success" ? "bg-emerald-100 dark:bg-emerald-900/30" :
                          "bg-gray-100 dark:bg-gray-700"
                        }`}>
                          {notif.type === "success" && <CheckCircle size={18} className="text-emerald-600" />}
                          {notif.type === "warning" && <AlertCircle size={18} className="text-yellow-600" />}
                          {(notif.type === "user" || notif.type === "info") && <Bell size={18} className={notif.type === "user" ? "text-blue-600" : "text-gray-600"} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-gray-900 dark:text-white text-sm">{notif.title}</p>
                            <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{notif.message}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{notif.time}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
                  <button
                    onClick={() => {
                      setShowNotifications(false)
                      router.push("/admin/announcements")
                    }}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="relative" ref={messagesRef}>
            <button 
              onClick={() => {
                setShowMessages(!showMessages)
                setShowNotifications(false)
              }}
              className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <MessageSquare size={20} className="text-gray-600 dark:text-gray-300" />
              {unreadMessages > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">{unreadMessages}</span>
              )}
            </button>

            {showMessages && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Messages</h3>
                  <button onClick={() => setShowMessages(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <X size={18} />
                  </button>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {messages.length === 0 && (
                    <div className="p-4 text-sm text-gray-500 dark:text-gray-400">No unread messages</div>
                  )}
                  {messages.map((msg) => (
                    <button
                      key={msg.id}
                      onClick={() => {
                        markMessageAsRead(msg.id)
                        setShowMessages(false)
                        router.push(`/admin/messages?messageId=${msg.id}`)
                      }}
                      className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex gap-3 items-start">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0 text-sm">
                          {msg.sender.split(" ")[0][0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-gray-900 dark:text-white text-sm">{msg.sender}</p>
                            <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">{msg.message}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{msg.time}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
                  <button onClick={() => router.push("/admin/messages")} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">Open Messages</button>
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button onClick={toggleTheme} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors hidden sm:block">
            {isDark ? (
              <Sun size={20} className="text-gray-600 dark:text-gray-300" />
            ) : (
              <Moon size={20} className="text-gray-600 dark:text-gray-300" />
            )}
          </button>

          {/* Currency Selector */}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as any)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none text-sm hidden md:block"
          >
            <option value="KES">KES</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>

          {/* Profile Menu */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold cursor-pointer hover:shadow-lg transition-shadow"
            >
              A
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="font-semibold text-gray-900 dark:text-white">Admin User</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">admin@example.com</p>
                </div>

                <Link
                  href="/admin/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <User size={18} />
                  <span>Admin Profile</span>
                </Link>

                <Link
                  href="/admin/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <Settings size={18} />
                  <span>Settings</span>
                </Link>

                <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 transition-colors"
                  >
                    <LogOut size={18} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
