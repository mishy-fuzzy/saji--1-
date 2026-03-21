import React from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"

export default function SubadminLayout({ children }: { children: React.ReactNode }) {
  const menuItems = [
    { label: "Dashboard", href: "/subadmin", icon: "LayoutDashboard" },
    { label: "Agents", href: "/subadmin/agents", icon: "Users" },
    { label: "Team Management", href: "/subadmin/team", icon: "Users2" },
    { label: "Performance", href: "/subadmin/performance", icon: "TrendingUp" },
    { label: "Reports", href: "/subadmin/reports", icon: "BarChart3" },
    { label: "Settings", href: "/subadmin/settings", icon: "Settings" },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar menuItems={menuItems} />
      <MobileNav menuItems={menuItems} />
      <div className="lg:ml-64">
        <Header />
        <main className="p-6 pb-20 lg:pb-6">{children}</main>
      </div>
    </div>
  )
}
