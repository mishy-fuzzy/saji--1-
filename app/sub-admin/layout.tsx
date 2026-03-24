"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthContext } from "@/lib/auth-context"
import { LoadingScreen } from "@/components/loading-screen"
import Link from "next/link"
import {
  LayoutDashboard, Users, User, LogOut, Menu, X, Shield, Bell, Search,
  CheckCircle, FileText, MessageCircle, BarChart3, ChevronDown, Settings
} from "lucide-react"

export default function SubAdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, logout } = useAuthContext()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [showMore, setShowMore] = useState(false)

  const normalizedRole = String(user?.role || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
  const hasSubAdminAccess = normalizedRole === "sub-admin" || normalizedRole === "subadmin"

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !isLoading && (!isAuthenticated || !hasSubAdminAccess)) {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, hasSubAdminAccess, router, mounted])

  if (isLoading || !mounted) return <LoadingScreen />
  if (!isAuthenticated || !hasSubAdminAccess) return null

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/sub-admin" },
    { icon: Users, label: "Users", href: "/sub-admin/users" },
    { icon: CheckCircle, label: "Verifications", href: "/sub-admin/verifications" },
    { icon: MessageCircle, label: "Messages", href: "/sub-admin/messages" },
    { icon: Bell, label: "SMS Notifications", href: "/sub-admin/notifications" },
    { icon: FileText, label: "Reports", href: "/sub-admin/reports" },
    { icon: BarChart3, label: "Analytics", href: "/sub-admin/analytics" },
    { icon: User, label: "Profile", href: "/sub-admin/profile" },
    { icon: Settings, label: "Settings", href: "/sub-admin/settings" },
  ]

  const isActive = (href: string) =>
    href === "/sub-admin" ? pathname === "/sub-admin" : pathname.startsWith(href)

  const notifications: Array<{ id: number; text: string; time: string; type: string }> = []

  const bottomNavItems = menuItems.slice(0, 4)
  const moreItems = menuItems.slice(4)

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar -- desktop */}
      <aside className={`fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-blue-700 to-blue-800 text-white transform transition-transform z-40 ${menuOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:relative flex flex-col`}>
        <div className="p-5 border-b border-blue-600 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Sub Admin</h1>
            <p className="text-[10px] text-blue-200">Management Portal</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-blue-100 hover:bg-blue-600/50"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-blue-600">
          <button
            onClick={() => { logout(); setMenuOpen(false) }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-100 hover:bg-blue-600/50 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex flex-col flex-1 overflow-hidden w-full">
        {/* Top Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between gap-3 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden text-gray-600 dark:text-gray-300">
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 flex-1 max-w-xs">
              <Search size={16} className="text-gray-400" />
              <input placeholder="Search..." className="bg-transparent text-sm outline-none w-full text-gray-700 dark:text-gray-200" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <Bell size={20} className="text-gray-600 dark:text-gray-300" />
                {notifications.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Notifications</h3>
                    <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 px-2 py-0.5 rounded-full font-medium">{notifications.length} new</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                    {notifications.map((n) => (
                      <div key={n.id} className="px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                        <p className="text-xs text-gray-900 dark:text-white font-medium">{n.text}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{n.time}</p>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div className="px-3 py-6 text-xs text-gray-500 dark:text-gray-400 text-center">No notifications.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">SA</div>
          </div>
        </header>

        <main className="flex-1 overflow-auto pb-20 lg:pb-0">
          <div className="container mx-auto p-4 lg:p-6">{children}</div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-around px-1 py-2 z-30">
          {bottomNavItems.map((item) => (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium ${isActive(item.href) ? "text-blue-600" : "text-gray-500"}`}>
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
          <div className="relative">
            <button onClick={() => setShowMore(!showMore)} className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium ${showMore ? "text-blue-600" : "text-gray-500"}`}>
              <ChevronDown size={20} className={`transition-transform ${showMore ? "rotate-180" : ""}`} />
              More
            </button>
            {showMore && (
              <div className="absolute bottom-14 right-0 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1 z-50">
                {moreItems.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setShowMore(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <item.icon size={16} />
                    {item.label}
                  </Link>
                ))}
                <button onClick={() => { logout(); setShowMore(false) }} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 w-full hover:bg-gray-50 dark:hover:bg-gray-700">
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {menuOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMenuOpen(false)} />}
    </div>
  )
}
