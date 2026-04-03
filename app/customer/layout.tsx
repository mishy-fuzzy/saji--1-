"use client";

import React from "react";

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuthContext } from "@/lib/auth-context"
import { 
  Home, Store, Briefcase, Users, MessageCircle, UserSearch, Settings,
  Bell, User, Menu, X, LogOut, ChevronRight, Wallet, Heart, MapPin,
  HelpCircle, Gift
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import Image from "next/image"

type CustomerNotification = {
  id: string
  title: string
  message: string
  time: string
  unread: boolean
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

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, logout, isAuthenticated, isLoading } = useAuthContext()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<CustomerNotification[]>([])

  const handleUnauthorized = useCallback(async () => {
    await logout()
  }, [logout])

  const navItems = [
    { icon: Home, label: "Home", href: "/customer/home" },
    { icon: Store, label: "Marketplace", href: "/customer/services" },
    { icon: Briefcase, label: "My Jobs", href: "/customer/jobs" },
    { icon: Users, label: "Community", href: "/customer/community" },
    { icon: MessageCircle, label: "Chat", href: "/customer/messages" },
  ];

  const sidebarItems = [
    ...navItems,
    {
      icon: UserSearch,
      label: "Find Specialists",
      href: "/customer/find-specialists",
    },
    { icon: Heart, label: "Favorites", href: "/customer/favorites" },
    {
      icon: MapPin,
      label: "Saved Addresses",
      href: "/customer/saved-addresses",
    },
    { icon: Wallet, label: "Wallet", href: "/customer/wallet" },
    { icon: Gift, label: "Refer & Earn", href: "/customer/referrals" },
    { icon: HelpCircle, label: "Help & Support", href: "/customer/help" },
    { icon: Settings, label: "Settings", href: "/customer/settings" },
  ]

  useEffect(() => {
    const loadNotifications = async () => {
      if (isLoading || !isAuthenticated || !user?.id) {
        setNotifications([])
        return
      }

      try {
        const response = await fetch("/api/notifications", { cache: "no-store" })
        if (response.status === 401) {
          await handleUnauthorized()
          return
        }

        const payload = await response.json()

        if (!response.ok || !payload?.ok || !Array.isArray(payload?.data)) {
          setNotifications([])
          return
        }

        const items: CustomerNotification[] = payload.data.map((item: any) => ({
          id: String(item?.id || ""),
          title: String(item?.title || "Notification"),
          message: String(item?.message || ""),
          time: formatRelativeTime(String(item?.createdAt || "")),
          unread: !Boolean(item?.read),
        }))

        setNotifications(items)
      } catch {
        setNotifications([])
      }
    }

    loadNotifications()
    const intervalId = window.setInterval(loadNotifications, 3000)
    return () => window.clearInterval(intervalId)
  }, [handleUnauthorized, isAuthenticated, isLoading, user?.id])

  const markAllNotificationsRead = async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      })

      if (response.status === 401) {
        await handleUnauthorized()
        return
      }

      setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })))
    } catch {
      // no-op
    }
  }

  const markNotificationAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, unread: false } : item)))
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })

      if (response.status === 401) {
        await handleUnauthorized()
      }
    } catch {
      // no-op
    }
  }

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-card">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-border">
          <Link href="/customer/home" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">
                S
              </span>
            </div>
            <span className="font-bold text-xl text-foreground">SAJI</span>
          </Link>
        </div>

        {/* User Profile Quick View */}
        <div className="p-4 border-b border-border">
          <Link
            href="/customer/profile"
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <Image
                  src={user.avatar || "/placeholder.svg"}
                  alt=""
                  width={40}
                  height={40}
                  className="object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">
                {user?.name || "Guest User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email || "guest@example.com"}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={logout}
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            {/* Mobile Menu Button */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetTitle className="sr-only">
                  Customer Navigation Menu
                </SheetTitle>
                <div className="flex items-center h-16 px-6 border-b border-border">
                  <Link
                    href="/customer/home"
                    className="flex items-center gap-2"
                  >
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-lg">
                        S
                      </span>
                    </div>
                    <span className="font-bold text-xl text-foreground">
                      SAJI
                    </span>
                  </Link>
                </div>
                <div className="p-4 border-b border-border">
                  <Link
                    href="/customer/profile"
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {user?.avatar ? (
                        <Image
                          src={user.avatar || "/placeholder.svg"}
                          alt=""
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {user?.name || "Guest User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email || "guest@example.com"}
                      </p>
                    </div>
                  </Link>
                </div>
                <nav className="flex-1 px-4 py-4 space-y-1">
                  {sidebarItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
                <div className="p-4 border-t border-border">
                  <Button
                    variant="ghost"
                    onClick={logout}
                    className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Page Title - Desktop Only */}
            <div className="hidden lg:block">
              <h1 className="text-lg font-semibold text-foreground">
                {sidebarItems.find(
                  (item) =>
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/"),
                )?.label ||
                  (pathname.includes("/notifications")
                    ? "Notifications"
                    : "Dashboard")}
              </h1>
            </div>

            {/* Mobile Logo */}
            <Link
              href="/customer/home"
              className="lg:hidden flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">
                  S
                </span>
              </div>
              <span className="font-bold text-lg text-foreground">SAJI</span>
            </Link>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowNotifications(false)}
                    />
                    <div className="absolute right-0 top-12 w-80 bg-card rounded-xl shadow-xl border border-border z-50 overflow-hidden">
                      <div className="p-4 border-b border-border flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">Notifications</h3>
                        <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={markAllNotificationsRead}>
                          Mark all read
                        </Button>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => markNotificationAsRead(notification.id)}
                            className={`p-4 border-b border-border last:border-0 hover:bg-muted transition-colors cursor-pointer ${
                              notification.unread ? "bg-primary/5" : ""
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {notification.unread && (
                                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                              )}
                              <div
                                className={notification.unread ? "" : "ml-5"}
                              >
                                <p className="font-medium text-sm text-foreground">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {notification.time}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Link
                        href="/customer/notifications"
                        className="block p-3 text-center text-sm text-primary font-medium hover:bg-muted transition-colors"
                        onClick={() => setShowNotifications(false)}
                      >
                        View All Notifications
                      </Link>
                    </div>
                  </>
                )}
              </div>

              {/* Profile */}
              <Link href="/customer/profile">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <Image
                        src={user.avatar || "/placeholder.svg"}
                        alt=""
                        width={32}
                        height={32}
                        className="object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-primary" />
                    )}
                  </div>
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="pb-20 lg:pb-6">{children}</main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 ${isActive ? "text-primary" : ""}`}
                  />
                  <span className="text-[10px] mt-1 font-medium">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
