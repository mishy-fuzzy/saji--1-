"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import { 
  Store, Package, ShoppingCart, MessageCircle, Wallet, User, Settings, LogOut, 
  X, Menu, BarChart3, Bell, Users, Star, Tag, Search, ChevronDown, MoreHorizontal
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuthContext } from "@/lib/auth-context"

type ShopNotification = {
  id: string
  title: string
  desc: string
  time: string
  read: boolean
  type: string
  actionHref?: string
}

function formatRelativeTime(value?: string) {
  if (!value) return "now"
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const mins = Math.max(1, Math.floor(diffMs / 60000))
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function ShopkeeperLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<ShopNotification[]>([])
  const notifRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuthContext()

  const isActive = (path: string) => pathname === path || (path !== "/shopkeeper" && pathname.startsWith(path + "/"))
  const isExactActive = (path: string) => pathname === path

  const menuItems = [
    { icon: Store, label: "Dashboard", href: "/shopkeeper" },
    { icon: Package, label: "Products", href: "/shopkeeper/products" },
    { icon: ShoppingCart, label: "Orders", href: "/shopkeeper/orders", badge: 5 },
    { icon: BarChart3, label: "Analytics", href: "/shopkeeper/analytics" },
    { icon: MessageCircle, label: "Messages", href: "/shopkeeper/messages", badge: 2 },
    { icon: Users, label: "Endorsements", href: "/shopkeeper/endorsements" },
    { icon: Wallet, label: "Earnings", href: "/shopkeeper/earnings" },
    { icon: Star, label: "Reviews", href: "/shopkeeper/reviews" },
    { icon: Tag, label: "Promotions", href: "/shopkeeper/promotions" },
    { icon: User, label: "Profile", href: "/shopkeeper/profile" },
  ]

  // Bottom nav: first 4 + More
  const bottomNavItems = menuItems.slice(0, 4)
  const moreNavItems = menuItems.slice(4)

  const unreadCount = notifications.filter(n => !n.read).length

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false)
      }
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await fetch("/api/notifications", { cache: "no-store" })
        const payload = await response.json()
        if (!response.ok || !payload?.ok || !Array.isArray(payload?.data)) {
          setNotifications([])
          return
        }

        const items: ShopNotification[] = payload.data.map((item: any) => ({
          id: String(item?.id || ""),
          title: String(item?.title || "Notification"),
          desc: String(item?.message || ""),
          time: formatRelativeTime(String(item?.createdAt || "")),
          read: Boolean(item?.read),
          type: String(item?.type || "order").toLowerCase(),
          actionHref: item?.actionHref ? String(item.actionHref) : undefined,
        }))

        setNotifications(items)
      } catch {
        setNotifications([])
      }
    }

    loadNotifications()
    const intervalId = window.setInterval(loadNotifications, 3000)
    return () => window.clearInterval(intervalId)
  }, [])

  const markAllNotificationsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      })
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
    } catch {
      // no-op to keep UI responsive
    }
  }

  const markNotificationAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)))
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
    } catch {
      // no-op
    }
  }

  const getNotifColor = (type: string) => {
    const colors: Record<string, string> = {
      order: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
      stock: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
      review: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
      endorsement: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
      payment: "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400",
    }
    return colors[type] || colors.order
  }

  const getNotifIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      order: <ShoppingCart className="w-4 h-4" />,
      stock: <Package className="w-4 h-4" />,
      review: <Star className="w-4 h-4" />,
      endorsement: <Users className="w-4 h-4" />,
      payment: <Wallet className="w-4 h-4" />,
    }
    return icons[type] || icons.order
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shadow-lg"
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:sticky left-0 top-0 w-64 h-screen bg-gradient-to-b from-amber-600 to-orange-700 dark:from-amber-800 dark:to-orange-900 text-white transition-transform duration-300 z-40 flex flex-col overflow-hidden`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-amber-500/40 mt-14 lg:mt-0 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">SAJI Shop</h2>
              <p className="text-xs text-amber-200">Shopkeeper Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const IconComponent = item.icon
              const active = item.href === "/shopkeeper" ? isExactActive(item.href) : isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                    active
                      ? "bg-white/20 shadow-lg"
                      : "hover:bg-white/10"
                  }`}
                >
                  <IconComponent className="w-[18px] h-[18px] flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-amber-500/40 flex-shrink-0 space-y-1.5">
          <Link href="/shopkeeper/settings" onClick={() => setSidebarOpen(false)}>
            <button className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
              <Settings size={16} />
              Settings
            </button>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full bg-red-500/80 hover:bg-red-500 text-white font-medium py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Left: Page title area (spacer for mobile hamburger) */}
            <div className="flex items-center gap-3">
              <div className="w-9 lg:hidden" /> {/* Spacer for hamburger */}
              <div className="hidden sm:flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1.5 w-64">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products, orders..."
                  className="bg-transparent text-sm outline-none flex-1 text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <div ref={notifRef} className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notificationsOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                      <button onClick={markAllNotificationsRead} className="text-xs text-amber-600 hover:text-amber-700 font-medium">
                        Mark all read
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            markNotificationAsRead(notif.id)
                            setNotificationsOpen(false)
                            if (notif.actionHref) {
                              router.push(notif.actionHref)
                            }
                          }}
                          className={`p-3 flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-0 ${
                            !notif.read ? "bg-amber-50/50 dark:bg-amber-900/10" : ""
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getNotifColor(notif.type)}`}>
                            {getNotifIcon(notif.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm ${!notif.read ? "font-semibold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                                {notif.title}
                              </p>
                              {!notif.read && (
                                <span className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{notif.desc}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{notif.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                      <button className="w-full text-center text-sm text-amber-600 hover:text-amber-700 font-medium py-1">
                        View All Notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar */}
              <Link href="/shopkeeper/profile" className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold">
                  S
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight">SAJI Shop</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Premium Plan</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden md:block" />
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 pb-20 lg:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        <div className="flex justify-around items-center h-16 px-1">
          {bottomNavItems.map((item) => {
            const IconComponent = item.icon
            const active = item.href === "/shopkeeper" ? isExactActive(item.href) : isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-0 ${
                  active
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                <div className="relative">
                  <IconComponent className="w-5 h-5" />
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium leading-tight">{item.label}</span>
              </Link>
            )
          })}

          {/* More Menu */}
          <div ref={moreRef} className="relative">
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
                moreMenuOpen || moreNavItems.some(item => item.href === "/shopkeeper" ? isExactActive(item.href) : isActive(item.href))
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-tight">More</span>
            </button>

            {/* More Menu Popup */}
            {moreMenuOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-1.5">
                  {moreNavItems.map((item) => {
                    const IconComponent = item.icon
                    const active = item.href === "/shopkeeper" ? isExactActive(item.href) : isActive(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMoreMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                          active
                            ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-semibold"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        <IconComponent className="w-4 h-4 flex-shrink-0" />
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                  <div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
                    <Link
                      href="/shopkeeper/settings"
                      onClick={() => setMoreMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Settings className="w-4 h-4 flex-shrink-0" />
                      <span>Settings</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </div>
  )
}
