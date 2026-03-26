"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
  LogOut,
  ChevronDown,
  ScrollText,
  Shield,
  Megaphone,
  Percent,
  BarChart3,
} from "lucide-react"
import { fetchAdminDashboard } from "@/lib/services/admin-dashboard-service"
import { logoutSession } from "@/lib/services/auth-service"

export function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [badgeData, setBadgeData] = useState({
    totalUsers: "-",
    activeJobs: "-",
    openDisputes: "-",
  })
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    const loadBadges = async () => {
      try {
        const payload = await fetchAdminDashboard()
        if (!mounted) return
        setBadgeData({
          totalUsers: payload.summary.totalUsers.toLocaleString(),
          activeJobs: payload.summary.activeJobs.toLocaleString(),
          openDisputes: payload.summary.openDisputes.toLocaleString(),
        })
      } catch {
        // Keep graceful defaults when dashboard summary is unavailable.
      }
    }

    loadBadges()
    return () => {
      mounted = false
    }
  }, [])

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin", badge: null },
    { icon: Users, label: "Users", href: "/admin/users", badge: badgeData.totalUsers },
    { icon: Briefcase, label: "Jobs", href: "/admin/jobs", badge: badgeData.activeJobs },
    { icon: AlertTriangle, label: "Disputes", href: "/admin/disputes", badge: badgeData.openDisputes },
    { icon: CreditCard, label: "Payments", href: "/admin/payments", badge: null },
    { icon: CheckCircle, label: "Verifications", href: "/admin/verifications", badge: "42" },
    { icon: BarChart3, label: "Analytics", href: "/admin/analytics", badge: null },
    { icon: DollarSign, label: "Pricing", href: "/admin/pricing", badge: null },
    { icon: Percent, label: "Commissions", href: "/admin/commissions", badge: null },
    { icon: Shield, label: "Moderation", href: "/admin/moderation", badge: "8" },
    { icon: Megaphone, label: "Announcements", href: "/admin/announcements", badge: null },
    { icon: ScrollText, label: "Audit Log", href: "/admin/audit-log", badge: null },
    { icon: Users, label: "Team", href: "/admin/team", badge: null },
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
        fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-blue-600 to-blue-800 text-white
        transform transition-all duration-300 z-40 flex flex-col
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        lg:relative lg:transform-none overflow-hidden
      `}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-blue-400/30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <LayoutDashboard size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold">Admin</h1>
              <p className="text-xs text-blue-200">Portal</p>
            </div>
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
                  flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200
                  ${active 
                    ? "bg-white text-blue-600 font-semibold shadow-lg" 
                    : "text-blue-50 hover:bg-blue-500/40"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} />
                  <span className="text-sm">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`
                    px-2 py-1 rounded-full text-xs font-semibold
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
            <p className="text-xs text-blue-200">Admin Status</p>
            <p className="text-sm font-semibold text-white mt-1">Online</p>
          </div>
          <button
            onClick={async () => {
              await logoutSession()
              localStorage.removeItem("saji_user")
              router.push("/")
              setIsOpen(false)
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg hover:bg-blue-500/40 transition-colors text-blue-50 hover:text-white font-medium text-sm"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setIsOpen(false)} />
      )}
    </>
  )
}
