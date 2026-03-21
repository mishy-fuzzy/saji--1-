"use client"

import { useState } from "react"
import { Home, Briefcase, MessageCircle, Wallet, User, ChevronDown, X, Menu, LogOut, Settings, ImageIcon, Bell, Calendar, Wrench, BarChart3, FileText, Users, Store, Gift, Award, ClipboardList } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuthContext } from "@/lib/auth-context"
import { Logo } from "@/components/logo"

export default function ProviderSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { logout, user } = useAuthContext()

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/")

  const menuItems = [
    { icon: Home, label: "Home", href: "/provider", exact: true },
    { icon: Briefcase, label: "Jobs", href: "/provider/jobs", badge: 3 },
    { icon: Wrench, label: "Services", href: "/provider/services" },
    { icon: Calendar, label: "Availability", href: "/provider/availability" },
    { icon: ClipboardList, label: "Quotes", href: "/provider/quotes" },
    { icon: Store, label: "My Shop", href: "/provider/shop" },
    { icon: ImageIcon, label: "My Content", href: "/provider/content" },
    { icon: MessageCircle, label: "Messages", href: "/provider/messages", badge: 5 },
    { icon: Wallet, label: "Wallet", href: "/provider/wallet" },
    { icon: FileText, label: "Invoices", href: "/provider/invoices" },
    { icon: BarChart3, label: "Analytics", href: "/provider/analytics" },
    { icon: Users, label: "Clients", href: "/provider/clients" },
    { icon: Gift, label: "Referrals", href: "/provider/referrals" },
    { icon: User, label: "Profile", href: "/provider/profile", hasSubmenu: true },
  ]

  const profileMenuItems = [
    { label: "My Account", href: "/provider/profile/account" },
    { label: "Work Area & Skills", href: "/provider/profile/skills" },
    { label: "Verification", href: "/provider/profile/verification" },
    { label: "Certifications", href: "/provider/profile/certifications" },
    { label: "Proof of Work", href: "/provider/profile/proof", badge: "2" },
    { label: "Payment Methods", href: "/provider/profile/payments" },
    { label: "Star Ratings", href: "/provider/profile/ratings" },
    { label: "Help & Support", href: "/provider/profile/help" },
    { label: "Settings", href: "/provider/profile/settings" },
  ]

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const isItemActive = (item: typeof menuItems[0]) => {
    if (item.exact) return pathname === item.href
    return pathname === item.href || pathname.startsWith(item.href + "/")
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <Logo size="sm" showText />
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative">
          <Bell className="w-6 h-6" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed left-0 top-0 w-64 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 z-50 flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <Logo size="md" showText />
          <p className="text-xs text-muted-foreground mt-1">Service Provider Portal</p>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0) || "P"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{user?.name || "Provider"}</p>
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Online
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const IconComponent = item.icon
            const active = isItemActive(item)

            if (item.hasSubmenu) {
              return (
                <div key={item.href}>
                  <button
                    onClick={() => setExpandedMenu(expandedMenu === "profile" ? null : "profile")}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                      active
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className="w-5 h-5" />
                      <span className="font-medium text-sm">{item.label}</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${expandedMenu === "profile" ? "rotate-180" : ""}`}
                    />
                  </button>

                  {expandedMenu === "profile" && (
                    <div className="mt-1 ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-1">
                      {profileMenuItems.map((subitem) => (
                        <Link
                          key={subitem.href}
                          href={subitem.href}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center justify-between text-sm py-2 px-3 rounded-lg transition-colors ${
                            pathname === subitem.href
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          {subitem.label}
                          {subitem.badge && (
                            <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                              {subitem.badge}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                  active
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <IconComponent className="w-5 h-5" />
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <Link href="/provider/profile/settings">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Settings className="w-5 h-5" />
              <span className="font-medium text-sm">Settings</span>
            </button>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40 safe-area-inset-bottom">
        <div className="flex justify-around py-2">
          {menuItems.slice(0, 5).map((item) => {
            const IconComponent = item.icon
            const active = isItemActive(item)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors ${
                  active
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                <div className="relative">
                  <IconComponent className="w-6 h-6" />
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
