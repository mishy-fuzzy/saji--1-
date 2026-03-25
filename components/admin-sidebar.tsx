"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Briefcase,
  AlertTriangle,
  CreditCard,
  CheckCircle,
  DollarSign,
  SettingsIcon,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ScrollText,
  Shield,
  Megaphone,
  Percent,
  BarChart3,
  MessageSquare,
} from "lucide-react"

type AdminSidebarProps = {
  isHidden?: boolean
}

export function AdminSidebar({ isHidden = false }: AdminSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [badgeCounts, setBadgeCounts] = useState({
    users: "0",
    jobs: "0",
    disputes: "0",
  })
  const pathname = usePathname()

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/admin/stats", {
          headers: {
            "x-user-role": "admin",
          },
        })
        const result = await response.json()
        if (result.ok) {
          setBadgeCounts({
            users: String(result.users ?? result.count ?? 0),
            jobs: String(result.jobs ?? 0),
            disputes: String(result.disputes ?? 0),
          })
        }
      } catch (error) {
        console.error("Failed to fetch admin stats:", error)
      }
    }
    fetchStats()
    const intervalId = window.setInterval(fetchStats, 15000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin", badge: null },
    { icon: Users, label: "Users", href: "/admin/users", badge: badgeCounts.users },
    { icon: Briefcase, label: "Jobs", href: "/admin/jobs", badge: badgeCounts.jobs },
    { icon: AlertTriangle, label: "Disputes", href: "/admin/disputes", badge: badgeCounts.disputes },
    { icon: CreditCard, label: "Payments", href: "/admin/payments", badge: null },
    { icon: CheckCircle, label: "Verifications", href: "/admin/verifications", badge: "0" },
    { icon: BarChart3, label: "Analytics", href: "/admin/analytics", badge: null },
    { icon: DollarSign, label: "Pricing", href: "/admin/pricing", badge: null },
    { icon: Percent, label: "Commissions", href: "/admin/commissions", badge: null },
    { icon: Shield, label: "Moderation", href: "/admin/moderation", badge: "0" },
    { icon: Megaphone, label: "Announcements", href: "/admin/announcements", badge: null },
    { icon: ScrollText, label: "Audit Log", href: "/admin/audit-log", badge: null },
    { icon: Users, label: "Team", href: "/admin/team", badge: null },
    { icon: MessageSquare, label: "Messages", href: "/admin/messages", badge: null },
    { icon: SettingsIcon, label: "Settings", href: "/admin/settings", badge: null },
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 h-screen bg-gradient-to-b from-blue-600 to-blue-800 text-white
        transform transition-all duration-300 z-40 flex flex-col
        ${isHidden ? "lg:w-0 lg:opacity-0 lg:pointer-events-none" : ""}
        ${isCollapsed ? "lg:w-20" : "lg:w-64"}
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        lg:relative lg:transform-none overflow-hidden
      `}
      >
        {/* Logo Section */}
        <div className="p-4 border-b border-blue-400/30 flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <LayoutDashboard size={24} />
            </div>
            {!isCollapsed && (
              <div className="flex-1">
                <h1 className="text-lg font-bold">Admin</h1>
                <p className="text-xs text-blue-200">Portal</p>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="hidden lg:inline-flex p-2 rounded-lg hover:bg-blue-500/40 transition-colors"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 p-4 overflow-y-auto space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  relative flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200
                  ${active 
                    ? "bg-white text-blue-600 font-semibold shadow-lg" 
                    : "text-blue-50 hover:bg-blue-500/40"
                  }
                `}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} />
                  {!isCollapsed && <span className="text-sm">{item.label}</span>}
                </div>
                {item.badge && (
                  <span className={`
                    ${isCollapsed 
                      ? "absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center p-1 border-2 border-blue-600 rounded-full text-[10px]" 
                      : "px-2 py-1 rounded-full text-xs"
                    }
                    font-semibold
                    ${active 
                      ? "bg-blue-100 text-blue-600" 
                      : "bg-blue-400/30 text-blue-100"
                    }
                  `}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer Section */}
        <div className="p-4 border-t border-blue-400/30 flex-shrink-0 space-y-2">
          <div className="px-4 py-3 rounded-lg bg-blue-500/20 border border-blue-400/30">
            {!isCollapsed && <p className="text-xs text-blue-200">Admin Status</p>}
            <p className="text-sm font-semibold text-white mt-1">Online</p>
          </div>
          {!isCollapsed && <p className="text-[11px] text-blue-100/80 px-1">Use profile menu to log out</p>}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setIsOpen(false)} />
      )}
    </>
  )
}
