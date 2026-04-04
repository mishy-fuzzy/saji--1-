"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/lib/auth-context"
import { normalizeRole } from "@/lib/role-utils"
import { LoadingScreen } from "@/components/loading-screen"
import {
  LayoutDashboard, CreditCard, User, LogOut, Menu, X, FileText,
  BarChart3, MessageCircle, RefreshCcw, FileSpreadsheet, Bell, Search,
  ChevronDown, MoreHorizontal
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

type SecretaryNotification = {
  id: string
  text: string
  time: string
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

export default function SecretaryLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, logout } = useAuthContext()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [notifications, setNotifications] = useState<SecretaryNotification[]>([])
  const hasSecretaryAccess = normalizeRole(user?.role) === "secretary"

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted || isLoading) return

    if (mounted && !isLoading && (!isAuthenticated || !hasSecretaryAccess)) {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, hasSecretaryAccess, router, mounted])

  if (isLoading || !mounted) return <LoadingScreen />
  if (!isAuthenticated || !hasSecretaryAccess) return null

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/secretary" },
    { icon: CreditCard, label: "Payments", href: "/secretary/payments" },
    { icon: FileText, label: "Invoicing", href: "/secretary/invoicing" },
    { icon: RefreshCcw, label: "Reconciliation", href: "/secretary/reconciliation" },
    { icon: BarChart3, label: "Analytics", href: "/secretary/analytics" },
    { icon: MessageCircle, label: "Messages", href: "/secretary/messages" },
    { icon: FileSpreadsheet, label: "Tax Reports", href: "/secretary/tax-reports" },
    { icon: User, label: "Profile", href: "/secretary/profile" },
  ]

  const isActive = (href: string) => {
    if (href === "/secretary") return pathname === "/secretary"
    return pathname.startsWith(href)
  }

  const bottomNavItems = menuItems.slice(0, 4)
  const moreItems = menuItems.slice(4)

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await fetch("/api/secretary/notifications", {
          cache: "no-store",
          headers: {
            "x-user-role": "secretary",
          },
        })
        const payload = await response.json()
        if (!response.ok || !payload?.ok || !Array.isArray(payload?.notifications)) {
          setNotifications([])
          return
        }

        const items = payload.notifications.map((item: any) => ({
          id: String(item?.id || ""),
          text: String(item?.text || "Notification"),
          time: formatRelativeTime(String(item?.time || "")),
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

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      {/* Desktop Sidebar */}
      <aside className={`fixed top-0 left-0 h-screen w-68 border-r border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950 text-slate-100 transform transition-transform z-40 ${menuOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:relative flex flex-col`}>
        <div className="p-6 border-b border-white/10">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300">
            Treasury
          </div>
          <h1 className="mt-4 text-lg font-bold tracking-tight text-white">Secretary Console</h1>
          <p className="mt-1 text-xs text-slate-400">{user?.name || "Secretary"}</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${isActive(item.href) ? "bg-emerald-400 text-slate-950 font-semibold shadow-lg shadow-emerald-400/20" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <button onClick={() => { logout(); setMenuOpen(false) }} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden w-full">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/10 bg-slate-950/85 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden text-slate-300">
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div className="hidden w-72 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-slate-200 sm:flex">
              <Search size={16} className="text-slate-400" />
              <input type="text" placeholder="Search payments, invoices..." className="flex-1 bg-transparent text-sm outline-none text-slate-100 placeholder:text-slate-500" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative rounded-full p-2 text-slate-300 hover:bg-white/5">
                <Bell size={20} />
                {notifications.length > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-400" />}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/30">
                  <div className="flex items-center justify-between border-b border-white/10 p-3">
                    <h3 className="text-sm font-semibold text-white">Notifications</h3>
                    <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs text-emerald-300">{notifications.length} new</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-white/10">
                    {notifications.map(n => (
                      <button
                        key={n.id}
                        onClick={() => {
                          setShowNotifications(false)
                          router.push("/secretary/messages")
                        }}
                        className="block w-full px-3 py-2.5 text-left hover:bg-white/5"
                      >
                        <p className="text-sm leading-snug text-white">{n.text}</p>
                        <p className="mt-1 text-xs text-slate-400">{n.time}</p>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-white/10 p-2">
                    <button
                      onClick={() => {
                        setShowNotifications(false)
                        router.push("/secretary/messages")
                      }}
                      className="w-full rounded-xl py-2 text-center text-xs font-medium text-emerald-300 hover:bg-white/5"
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400 text-xs font-bold text-slate-950">
              {(user?.name || "S")[0]}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0">
          <div className="container mx-auto px-4 py-5 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-white/10 bg-slate-950/95 px-1 py-1.5 backdrop-blur-xl safe-bottom">
        {bottomNavItems.map((item) => (
          <Link key={item.href} href={item.href} className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 ${isActive(item.href) ? "text-emerald-300" : "text-slate-500"}`}>
            <item.icon size={20} />
            <span className="text-[10px] font-medium truncate">{item.label}</span>
          </Link>
        ))}
        {/* More menu */}
        <div className="relative flex flex-col items-center gap-0.5 px-2 py-1.5 flex-1">
          <button onClick={() => setShowMore(!showMore)} className={`flex flex-col items-center gap-0.5 ${moreItems.some(i => isActive(i.href)) ? "text-emerald-300" : "text-slate-500"}`}>
            <MoreHorizontal size={20} />
            <span className="text-[10px] font-medium">More</span>
          </button>
          {showMore && (
            <div className="absolute bottom-full right-0 mb-2 w-48 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/30 z-50">
              {moreItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setShowMore(false)} className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${isActive(item.href) ? "bg-emerald-400/10 text-emerald-300 font-medium" : "text-slate-300 hover:bg-white/5"}`}>
                  <item.icon size={18} />
                  {item.label}
                </Link>
              ))}
              <button onClick={() => { logout(); setShowMore(false) }} className="w-full flex items-center gap-3 border-t border-white/10 px-4 py-3 text-sm text-rose-300 hover:bg-white/5">
                <LogOut size={18} />
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Overlays */}
      {menuOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setMenuOpen(false)} />}
      {(showNotifications || showMore) && <div className="fixed inset-0 z-40 lg:z-auto" onClick={() => { setShowNotifications(false); setShowMore(false) }} />}
    </div>
  )
}
