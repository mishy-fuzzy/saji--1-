"use client"

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
  MessageSquare,
} from "lucide-react"

export function AdminMobileNav() {
  const pathname = usePathname()

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
    { icon: Users, label: "Users", href: "/admin/users" },
    { icon: Briefcase, label: "Jobs", href: "/admin/jobs" },
    { icon: AlertTriangle, label: "Disputes", href: "/admin/disputes" },
    { icon: MessageSquare, label: "Messages", href: "/admin/messages" },
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 lg:hidden z-40">
      <div className="flex items-center justify-around">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 py-3 px-4 flex-1 text-center transition-colors ${
                active
                  ? "text-blue-600 dark:text-blue-400 border-t-2 border-blue-600 dark:border-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
              }`}
            >
              <Icon size={24} />
              <span className="text-xs font-semibold">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
