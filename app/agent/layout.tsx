"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthContext } from "@/lib/auth-context"
import { LoadingScreen } from "@/components/loading-screen"
import Link from "next/link"
import {
  LayoutDashboard, AlertTriangle, User, LogOut, Menu, X, Shield, Bell, Search,
  BarChart3, DollarSign, Wallet, MessageCircle, Trophy, ChevronDown, Settings
} from "lucide-react"

type AgentNotification = { id?: string; text: string; time: string }

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

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, logout } = useAuthContext()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [notifications, setNotifications] = useState<AgentNotification[]>([])

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    if (mounted && !isLoading && (!isAuthenticated || user?.role !== "agent")) router.push("/")
  }, [isAuthenticated, isLoading, user, router, mounted])

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch("/api/agent/notifications", {
          cache: "no-store",
          headers: {
            "x-user-role": "agent",
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

    fetchNotifications()
    const intervalId = window.setInterval(fetchNotifications, 3000)
    return () => window.clearInterval(intervalId)
  }, [])

  if (isLoading || !mounted) return <LoadingScreen />
  if (!isAuthenticated || user?.role !== "agent") return null

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/agent" },
    { icon: AlertTriangle, label: "Disputes", href: "/agent/disputes" },
    { icon: BarChart3, label: "Stats", href: "/agent/stats" },
    { icon: DollarSign, label: "Commissions", href: "/agent/commissions" },
    { icon: Wallet, label: "Withdrawals", href: "/agent/withdrawals" },
    { icon: MessageCircle, label: "Messages", href: "/agent/messages" },
    { icon: Trophy, label: "Leaderboard", href: "/agent/leaderboard" },
    { icon: BarChart3, label: "Analytics", href: "/agent/analytics" },
    { icon: User, label: "Profile", href: "/agent/profile" },
  ]

  const isActive = (href: string) => href === "/agent" ? pathname === "/agent" : pathname.startsWith(href)
  const bottomNav = menuItems.slice(0, 4)
  const moreItems = menuItems.slice(4)

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      <aside className={`fixed top-0 left-0 h-screen w-68 border-r border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950 text-slate-100 transform transition-transform z-40 ${menuOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:relative flex flex-col`}>
        <div className="flex items-center gap-3 border-b border-white/10 p-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/15">
            <Shield className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-white">Agent Console</h1>
            <p className="text-[10px] text-amber-300/80">Disputes and Customer Queries</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {menuItems.map(item => (
            <Link key={item.href} href={item.href} onClick={()=>setMenuOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive(item.href)?"bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20":"text-slate-300 hover:bg-white/5 hover:text-white"}`}>
              <item.icon size={18} />{item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <button onClick={()=>{logout();setMenuOpen(false)}} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5"><LogOut size={18}/>Logout</button>
        </div>
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden w-full">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/10 bg-slate-950/85 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button onClick={()=>setMenuOpen(!menuOpen)} className="lg:hidden text-slate-300">{menuOpen?<X size={22}/>:<Menu size={22}/>}</button>
            <div className="hidden w-72 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 sm:flex"><Search size={16} className="text-slate-400"/><input placeholder="Search disputes, customers..." className="w-full bg-transparent text-sm outline-none text-slate-100 placeholder:text-slate-500"/></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={()=>setNotifOpen(!notifOpen)} className="relative rounded-full p-2 text-slate-300 hover:bg-white/5"><Bell size={20}/><span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-400"/></button>
              {notifOpen && <div className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/30">
                <div className="border-b border-white/10 p-3"><h3 className="text-sm font-semibold text-white">Notifications</h3></div>
                <div className="max-h-48 overflow-y-auto divide-y divide-white/10">
                  {notifications.length === 0 && (
                    <div className="px-3 py-6 text-center text-xs text-slate-400">No notifications.</div>
                  )}
                  {notifications.map((n, i) => (
                    <div key={n.id || i} className="px-3 py-2 hover:bg-white/5"><p className="text-xs text-white">{n.text}</p><p className="mt-0.5 text-[10px] text-slate-400">{n.time}</p></div>
                  ))}
                </div>
              </div>}
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-slate-950">AG</div>
          </div>
        </header>

        <main className="flex-1 overflow-auto pb-20 lg:pb-0"><div className="container mx-auto px-4 py-5 lg:px-8 lg:py-8">{children}</div></main>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-white/10 bg-slate-950/95 px-1 py-2 backdrop-blur-xl">
          {bottomNav.map(item => (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium ${isActive(item.href)?"text-amber-300":"text-slate-500"}`}><item.icon size={20}/>{item.label}</Link>
          ))}
          <div className="relative">
            <button onClick={()=>setShowMore(!showMore)} className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium ${showMore?"text-amber-300":"text-slate-500"}`}><ChevronDown size={20} className={`transition-transform ${showMore?"rotate-180":""}`}/>More</button>
            {showMore && <div className="absolute bottom-14 right-0 z-50 w-44 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 py-1 shadow-2xl shadow-black/30">
              {moreItems.map(item => (<Link key={item.href} href={item.href} onClick={()=>setShowMore(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"><item.icon size={16}/>{item.label}</Link>))}
              <button onClick={()=>{logout();setShowMore(false)}} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-300 hover:bg-white/5"><LogOut size={16}/>Logout</button>
            </div>}
          </div>
        </nav>
      </div>

      {menuOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={()=>setMenuOpen(false)} />}
    </div>
  )
}
