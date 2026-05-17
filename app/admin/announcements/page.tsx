"use client"

import { useCallback, useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Megaphone, Plus, Send, Users, Clock, Eye, Trash2, Edit3 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

type Announcement = {
  id: string
  title: string
  message: string
  audience: string
  status: "sent" | "scheduled" | "draft"
  sentAt: string
  scheduledFor?: string | null
  views: number
  type: string
  requestedChannels?: string[]
  deliveryChannels: string[]
}

const initialAnnouncements: Announcement[] = []

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [newAudience, setNewAudience] = useState("All Users")
  const [filter, setFilter] = useState("all")
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState("")
  const [channelState, setChannelState] = useState({ inApp: true, email: true, sms: false })
  const [sendMode, setSendMode] = useState<"now" | "schedule">("now")
  const [scheduledFor, setScheduledFor] = useState("")

  const loadAnnouncements = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/announcements", {
        cache: "no-store",
        headers: { "x-user-role": "admin" },
      })

      const payload = await response.json()
      if (!response.ok || !payload?.ok || !Array.isArray(payload?.data)) {
        return
      }

      setAnnouncements(
        payload.data.map((item: any) => ({
          id: String(item.id),
          title: String(item.title || "Announcement"),
          message: String(item.message || ""),
          audience: String(item.audience || "All Users"),
          status: item.status === "sent" || item.status === "scheduled" ? item.status : "draft",
          sentAt: String(item.sentAt || "-"),
          scheduledFor: item.scheduledFor ? String(item.scheduledFor) : null,
          views: Number(item.views || 0),
          type: String(item.type || "general"),
          requestedChannels: Array.isArray(item.requestedChannels)
            ? item.requestedChannels.map((channel: unknown) => String(channel))
            : [],
          deliveryChannels: Array.isArray(item.deliveryChannels)
            ? item.deliveryChannels.map((channel: unknown) => String(channel))
            : [],
        })),
      )
    } catch {
      setAnnouncements([])
    }
  }, [])

  const dispatchScheduled = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/announcements", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "admin",
        },
        body: JSON.stringify({ action: "dispatch-scheduled" }),
      })

      const payload = await response.json()
      if (response.ok && payload?.ok && payload?.data?.processed > 0) {
        await loadAnnouncements()
      }
    } catch {
    }
  }, [loadAnnouncements])

  useEffect(() => {
    loadAnnouncements()
    dispatchScheduled()
    const intervalId = window.setInterval(dispatchScheduled, 60000)
    return () => window.clearInterval(intervalId)
  }, [dispatchScheduled, loadAnnouncements])

  const filtered = announcements.filter(a => {
    if (filter === "all") return true
    return a.status === filter
  })

  const submitAnnouncement = async (status: Announcement["status"]) => {
    if (!newTitle.trim() || !newMessage.trim()) {
      setFormError("Title and message are required.")
      return
    }

    const selectedChannels = [
      ...(channelState.inApp ? ["in-app"] : []),
      ...(channelState.email ? ["email"] : []),
      ...(channelState.sms ? ["sms"] : []),
    ]

    if (selectedChannels.length === 0) {
      setFormError("Select at least one delivery channel.")
      return
    }

    let scheduledForValue: string | undefined
    if (status === "scheduled") {
      if (!scheduledFor) {
        setFormError("Pick a schedule time.")
        return
      }

      const parsed = new Date(scheduledFor)
      if (Number.isNaN(parsed.getTime())) {
        setFormError("Schedule time is invalid.")
        return
      }

      if (parsed.getTime() <= Date.now()) {
        setFormError("Schedule time must be in the future.")
        return
      }

      scheduledForValue = parsed.toISOString()
    }

    setIsSaving(true)
    setFormError("")

    try {
      const response = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "admin",
        },
        body: JSON.stringify({
          title: newTitle,
          message: newMessage,
          audience: newAudience,
          status,
          type: "general",
          channels: selectedChannels,
          scheduledFor: scheduledForValue,
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload?.ok || !payload?.data) {
        setFormError(String(payload?.error || "Failed to save announcement"))
        return
      }

      const created: Announcement = {
        id: String(payload.data.id),
        title: String(payload.data.title || newTitle),
        message: String(payload.data.message || newMessage),
        audience: String(payload.data.audience || newAudience),
        status: payload.data.status === "sent" || payload.data.status === "scheduled" ? payload.data.status : "draft",
        sentAt: String(payload.data.sentAt || "-"),
        scheduledFor: payload.data.scheduledFor ? String(payload.data.scheduledFor) : null,
        views: Number(payload.data.views || payload.data.recipientCount || 0),
        type: String(payload.data.type || "general"),
        requestedChannels: Array.isArray(payload.data.requestedChannels)
          ? payload.data.requestedChannels.map((channel: unknown) => String(channel))
          : selectedChannels,
        deliveryChannels: Array.isArray(payload.data.deliveryChannels)
          ? payload.data.deliveryChannels.map((channel: unknown) => String(channel))
          : [],
      }

      setAnnouncements(prev => [created, ...prev])
      setNewTitle("")
      setNewMessage("")
      setScheduledFor("")
      setSendMode("now")
      setChannelState({ inApp: true, email: true, sms: false })
      setShowCreate(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSend = async (id: string) => {
    const response = await fetch("/api/admin/announcements", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "admin",
      },
      body: JSON.stringify({ id, action: "send" }),
    })

    const payload = await response.json()
    if (!response.ok || !payload?.ok) return

    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, status: "sent", sentAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), scheduledFor: null, views: Number(payload?.data?.recipientCount || a.views), deliveryChannels: Array.isArray(payload?.data?.deliveryChannels) ? payload.data.deliveryChannels.map((channel: unknown) => String(channel)) : a.deliveryChannels } : a))
  }

  const handleDelete = async (id: string) => {
    const response = await fetch("/api/admin/announcements", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "admin",
      },
      body: JSON.stringify({ id, action: "delete" }),
    })

    const payload = await response.json()
    if (!response.ok || !payload?.ok) return

    setAnnouncements(prev => prev.filter(a => a.id !== id))
  }

  const statusBadge = (s: string) => {
    switch (s) {
      case "sent": return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
      case "scheduled": return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
      case "draft": return "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
      default: return "bg-gray-100 text-gray-600"
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Announcements</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Broadcast messages to all platform users</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5 text-xs w-fit"><Plus size={14} />New Announcement</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Announcement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Title</label>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Announcement title..." className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Message</label>
                <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} rows={4} placeholder="Write your announcement..." className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Target Audience</label>
                <select value={newAudience} onChange={e => setNewAudience(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-900 dark:text-white">
                  <option>All Users</option>
                  <option>Providers</option>
                  <option>Shopkeepers</option>
                  <option>Customers</option>
                  <option>Agents</option>
                  <option>Internal Team</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Delivery Channels</label>
                <div className="flex flex-wrap gap-2">
                  <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={channelState.inApp}
                      onChange={() => setChannelState(prev => ({ ...prev, inApp: !prev.inApp }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    In-app
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={channelState.email}
                      onChange={() => setChannelState(prev => ({ ...prev, email: !prev.email }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Email
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={channelState.sms}
                      onChange={() => setChannelState(prev => ({ ...prev, sms: !prev.sms }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    SMS
                  </label>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Timing</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSendMode("now")}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${sendMode === "now" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}
                  >
                    Send now
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendMode("schedule")}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${sendMode === "schedule" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}
                  >
                    Schedule
                  </button>
                </div>
                {sendMode === "schedule" && (
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(event) => setScheduledFor(event.target.value)}
                    className="mt-2 w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none text-gray-900 dark:text-white"
                  />
                )}
              </div>
              {formError && (
                <p className="text-xs text-red-600 dark:text-red-400">{formError}</p>
              )}
              <div className="flex gap-2">
                <Button onClick={() => submitAnnouncement("draft")} disabled={isSaving} className="flex-1 bg-blue-600 hover:bg-blue-700 gap-1.5 text-sm">
                  <Send size={14} />{isSaving ? "Saving..." : "Save as Draft"}
                </Button>
                <Button
                  onClick={() => submitAnnouncement(sendMode === "schedule" ? "scheduled" : "sent")}
                  disabled={isSaving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-1.5 text-sm"
                >
                  <Send size={14} />{isSaving ? "Saving..." : sendMode === "schedule" ? "Schedule" : "Send Now"}
                </Button>
              </div>
              <Button variant="outline" onClick={() => setShowCreate(false)} className="text-sm">Cancel</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Sent", value: announcements.filter(a => a.status === "sent").length.toString(), icon: Send },
          { label: "Total Views", value: announcements.reduce((sum, a) => sum + a.views, 0).toLocaleString(), icon: Eye },
          { label: "Scheduled", value: announcements.filter(a => a.status === "scheduled").length.toString(), icon: Clock },
          { label: "Drafts", value: announcements.filter(a => a.status === "draft").length.toString(), icon: Edit3 },
        ].map((s, i) => (
          <Card key={i} className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 w-fit">
        {["all", "sent", "scheduled", "draft"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${filter === f ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm" : "text-gray-500"}`}>
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      {/* Announcements List */}
      <div className="space-y-3">
        {filtered.map(a => (
          <Card key={a.id} className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${a.status === "sent" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" : a.status === "scheduled" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600" : "bg-gray-100 dark:bg-gray-700 text-gray-500"}`}>
                <Megaphone size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{a.title}</h3>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusBadge(a.status)}`}>{a.status}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 leading-relaxed line-clamp-2">{a.message}</p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
                  <span className="flex items-center gap-1"><Users size={11} />{a.audience}</span>
                  <span className="flex items-center gap-1"><Clock size={11} />{a.status === "scheduled" && a.scheduledFor ? `Scheduled: ${new Date(a.scheduledFor).toLocaleString()}` : a.sentAt}</span>
                  {a.views > 0 && <span className="flex items-center gap-1"><Eye size={11} />{a.views.toLocaleString()} views</span>}
                </div>
                {a.status === "sent" && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {a.deliveryChannels.length > 0 ? (
                      a.deliveryChannels.map((channel) => (
                        <span key={channel} className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {channel === "sms" ? "SMS" : channel === "email" ? "Email" : "In-app"}
                        </span>
                      ))
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        No delivery metadata
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex sm:flex-col gap-2 flex-shrink-0">
                {a.status === "draft" && <Button size="sm" onClick={() => handleSend(a.id)} className="gap-1 text-xs bg-blue-600 hover:bg-blue-700"><Send size={12} />Send</Button>}
                {a.status === "scheduled" && <Button size="sm" onClick={() => handleSend(a.id)} className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700"><Send size={12} />Send Now</Button>}
                <Button size="sm" variant="outline" onClick={() => handleDelete(a.id)} className="gap-1 text-xs text-red-600 border-red-200 hover:bg-red-50"><Trash2 size={12} /></Button>
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No announcements available.
          </Card>
        )}
      </div>
    </div>
  )
}
