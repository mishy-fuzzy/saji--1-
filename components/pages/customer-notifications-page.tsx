"use client"

import { useState } from "react"
import { useAuthContext } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Bell, CheckCircle, Trash2, Briefcase, MessageCircle, Wallet, Shield,
  Star, Clock, AlertTriangle, Gift, ChevronRight, Megaphone, Filter
} from "lucide-react"
import Link from "next/link"

interface Notification {
  id: number
  type: "job" | "message" | "payment" | "system" | "review" | "promo"
  title: string
  message: string
  timestamp: string
  read: boolean
  action?: { label: string; href: string }
}

const initialNotifications: Notification[] = [
  { id: 1, type: "job", title: "Provider En Route", message: "Sarah M. is on her way. ETA 12 minutes.", timestamp: "2 min ago", read: false, action: { label: "Track", href: "/customer/jobs" } },
  { id: 2, type: "message", title: "New Message", message: "John P. sent you a message about plumbing repairs.", timestamp: "15 min ago", read: false, action: { label: "Reply", href: "/customer/messages" } },
  { id: 3, type: "payment", title: "Payment Confirmed", message: "KES 2,500 for house cleaning has been charged to your wallet.", timestamp: "1 hour ago", read: false, action: { label: "View", href: "/customer/wallet" } },
  { id: 4, type: "review", title: "Rate Your Service", message: "How was your plumbing service with Andrew O.?", timestamp: "2 hours ago", read: false, action: { label: "Rate Now", href: "/customer/jobs" } },
  { id: 5, type: "promo", title: "Weekend Special", message: "Get 20% off all cleaning services this weekend.", timestamp: "5 hours ago", read: true },
  { id: 6, type: "system", title: "Account Verified", message: "Your identity verification is complete.", timestamp: "Yesterday", read: true },
  { id: 7, type: "job", title: "Job Completed", message: "Your electrical wiring job has been marked as complete.", timestamp: "Yesterday", read: true, action: { label: "Review", href: "/customer/jobs" } },
  { id: 8, type: "payment", title: "Refund Processed", message: "KES 1,200 has been refunded to your wallet.", timestamp: "2 days ago", read: true, action: { label: "View", href: "/customer/wallet" } },
  { id: 9, type: "promo", title: "Refer & Earn", message: "Invite friends and earn KES 500 for each referral.", timestamp: "3 days ago", read: true, action: { label: "Refer", href: "/customer/referrals" } },
  { id: 10, type: "system", title: "Security Alert", message: "A new device was used to log into your account.", timestamp: "4 days ago", read: true },
]

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  job: { icon: Briefcase, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
  message: { icon: MessageCircle, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  payment: { icon: Wallet, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30" },
  system: { icon: Shield, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800" },
  review: { icon: Star, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/30" },
  promo: { icon: Gift, color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-100 dark:bg-pink-900/30" },
}

type FilterType = "all" | "unread" | "job" | "message" | "payment"

export function CustomerNotificationsPage() {
  const { user } = useAuthContext()
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [filter, setFilter] = useState<FilterType>("all")

  const unreadCount = notifications.filter(n => !n.read).length

  const filtered = notifications.filter(n => {
    if (filter === "unread") return !n.read
    if (filter === "all") return true
    return n.type === filter
  })

  const today = filtered.filter(n => n.timestamp.includes("min") || n.timestamp.includes("hour"))
  const earlier = filtered.filter(n => !n.timestamp.includes("min") && !n.timestamp.includes("hour"))

  const markAsRead = (id: number) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  const markAllAsRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  const deleteNotif = (id: number) => setNotifications(prev => prev.filter(n => n.id !== id))

  const filters: { id: FilterType; label: string }[] = [
    { id: "all", label: "All" },
    { id: "unread", label: `Unread (${unreadCount})` },
    { id: "job", label: "Jobs" },
    { id: "message", label: "Messages" },
    { id: "payment", label: "Payments" },
  ]

  const NotifCard = ({ notif }: { notif: Notification }) => {
    const cfg = typeConfig[notif.type] || typeConfig.system
    const Icon = cfg.icon
    return (
      <div
        className={`group flex items-start gap-3 p-4 rounded-xl transition-all hover:shadow-sm cursor-pointer ${
          !notif.read ? "bg-primary/5 dark:bg-primary/10" : "hover:bg-muted/50"
        }`}
        onClick={() => markAsRead(notif.id)}
      >
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${cfg.bg}`}>
          <Icon className={`w-5 h-5 ${cfg.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-semibold text-foreground ${!notif.read ? "" : "font-medium"}`}>{notif.title}</p>
            {!notif.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />{notif.timestamp}
            </span>
            {notif.action && (
              <Link
                href={notif.action.href}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
                onClick={e => e.stopPropagation()}
              >
                {notif.action.label}<ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); deleteNotif(notif.id) }}
          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 rounded-lg transition-all flex-shrink-0"
          aria-label="Delete notification"
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground mt-1">{unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}</p>
          </div>
          {unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={markAllAsRead} className="text-xs bg-transparent">
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />Mark all read
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filter === f.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Grouped Notifications */}
        {filtered.length > 0 ? (
          <div className="space-y-6">
            {today.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Today</h3>
                <Card className="border-0 shadow-sm divide-y divide-border/50 overflow-hidden">
                  {today.map(n => <NotifCard key={n.id} notif={n} />)}
                </Card>
              </div>
            )}
            {earlier.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Earlier</h3>
                <Card className="border-0 shadow-sm divide-y divide-border/50 overflow-hidden">
                  {earlier.map(n => <NotifCard key={n.id} notif={n} />)}
                </Card>
              </div>
            )}
          </div>
        ) : (
          <Card className="border-0 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground mb-1">No notifications</p>
            <p className="text-sm text-muted-foreground">
              {filter === "unread" ? "You've read all your notifications." : "Nothing to show for this filter."}
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
