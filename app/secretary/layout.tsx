"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/lib/auth-context"
import { LoadingScreen } from "@/components/loading-screen"
import {
  LayoutDashboard, CreditCard, User, LogOut, Menu, X, FileText,
  BarChart3, MessageCircle, RefreshCcw, FileSpreadsheet, Bell, Search,
  ChevronDown, MoreHorizontal
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function SecretaryLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, logout } = useAuthContext()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showMore, setShowMore] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !isLoading && (!isAuthenticated || user?.role !== "secretary")) {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, user, router, mounted])

  if (isLoading || !mounted) return <LoadingScreen />
  if (!isAuthenticated || user?.role !== "secretary") return null

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

  const notifications = [
    { id: 1, text: "Payment of KES 45,000 requires approval", time: "2m ago", type: "payment" },
    { id: 2, text: "Invoice #1089 overdue by 3 days", time: "15m ago", type: "invoice" },
    { id: 3, text: "Reconciliation discrepancy found - KES 12,500", time: "1h ago", type: "alert" },
    { id: 4, text: "New tax filing deadline approaching", time: "3h ago", type: "tax" },
  ]

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <aside className={`fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-blue-600 to-blue-700 text-white transform transition-transform z-40 ${menuOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:relative flex flex-col`}>
        <div className="p-5 border-b border-blue-500/40">
          <h1 className="text-lg font-bold tracking-tight">Secretary Portal</h1>
          <p className="text-blue-200 text-xs mt-0.5">{user?.name || "Secretary"}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive(item.href) ? "bg-white text-blue-600 font-semibold shadow-sm" : "hover:bg-blue-500/50 text-blue-50"}`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-blue-500/40">
          <button onClick={() => { logout(); setMenuOpen(false) }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-500/50 transition-colors text-blue-100 text-sm">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden w-full">
        {/* Top Header Bar */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between gap-3 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden text-gray-600 dark:text-gray-300">
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 w-64">
              <Search size={16} className="text-gray-400" />
              <input type="text" placeholder="Search transactions..." className="bg-transparent text-sm outline-none flex-1 text-gray-700 dark:text-gray-200 placeholder:text-gray-400" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                  <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                    <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full">{notifications.length} new</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => {
                          setShowNotifications(false)
                          router.push("/secretary/messages")
                        }}
                        className="px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                      >
                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">{n.text}</p>
                        <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => {
                        setShowNotifications(false)
                        router.push("/secretary/messages")
                      }}
                      className="w-full text-center text-xs text-blue-600 dark:text-blue-400 font-medium py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              {(user?.name || "S")[0]}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0">
          <div className="container mx-auto p-4 lg:p-6">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40 flex items-center justify-around px-1 py-1.5 safe-bottom">
        {bottomNavItems.map((item) => (
          <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-0 flex-1 ${isActive(item.href) ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}`}>
            <item.icon size={20} />
            <span className="text-[10px] font-medium truncate">{item.label}</span>
          </Link>
        ))}
        {/* More menu */}
        <div className="relative flex flex-col items-center gap-0.5 px-2 py-1.5 flex-1">
          <button onClick={() => setShowMore(!showMore)} className={`flex flex-col items-center gap-0.5 ${moreItems.some(i => isActive(i.href)) ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}`}>
            <MoreHorizontal size={20} />
            <span className="text-[10px] font-medium">More</span>
          </button>
          {showMore && (
            <div className="absolute bottom-full mb-2 right-0 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
              {moreItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setShowMore(false)} className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${isActive(item.href) ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                  <item.icon size={18} />
                  {item.label}
                </Link>
              ))}
              <button onClick={() => { logout(); setShowMore(false) }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-t border-gray-100 dark:border-gray-700">
                <LogOut size={18} />
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Overlays */}
      {menuOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMenuOpen(false)} />}
      {(showNotifications || showMore) && <div className="fixed inset-0 z-40 lg:z-auto" onClick={() => { setShowNotifications(false); setShowMore(false) }} />}
    </div>
  )
}
