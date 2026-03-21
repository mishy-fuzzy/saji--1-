"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Megaphone, Plus, Send, Users, Clock, CheckCircle2, Eye, Trash2, Edit3, Globe } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const initialAnnouncements = [
  { id: 1, title: "Platform Maintenance - Feb 25", message: "SAJI will undergo scheduled maintenance on Feb 25, 2026 from 2:00 AM to 5:00 AM EAT. Some services may be temporarily unavailable.", audience: "All Users", status: "sent", sentAt: "Feb 20, 2026", views: 8420, type: "maintenance" },
  { id: 2, title: "New Commission Structure", message: "Starting March 1, provider commissions will be reduced from 12% to 10% for Gold-tier providers. Check your dashboard for details.", audience: "Providers", status: "sent", sentAt: "Feb 18, 2026", views: 3210, type: "policy" },
  { id: 3, title: "Holiday Promotions Campaign", message: "Launch your Easter promotions early! New promotion tools are now available in your shopkeeper dashboard.", audience: "Shopkeepers", status: "scheduled", sentAt: "Mar 1, 2026", views: 0, type: "promo" },
  { id: 4, title: "Agent Performance Bonus Q1", message: "Top 10 performing agents in Q1 will receive a KES 50,000 bonus. Keep resolving disputes efficiently!", audience: "Agents", status: "sent", sentAt: "Feb 15, 2026", views: 45, type: "internal" },
  { id: 5, title: "KYC Deadline Reminder", message: "All providers must complete KYC verification by March 15 to continue receiving payouts.", audience: "Providers", status: "draft", sentAt: "-", views: 0, type: "policy" },
]

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState(initialAnnouncements)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [newAudience, setNewAudience] = useState("All Users")
  const [filter, setFilter] = useState("all")

  const filtered = announcements.filter(a => {
    if (filter === "all") return true
    return a.status === filter
  })

  const handleCreate = () => {
    if (!newTitle.trim() || !newMessage.trim()) return
    setAnnouncements(prev => [
      { id: Date.now(), title: newTitle, message: newMessage, audience: newAudience, status: "draft", sentAt: "-", views: 0, type: "general" },
      ...prev,
    ])
    setNewTitle("")
    setNewMessage("")
    setShowCreate(false)
  }

  const handleSend = (id: number) => {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, status: "sent", sentAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) } : a))
  }

  const handleDelete = (id: number) => setAnnouncements(prev => prev.filter(a => a.id !== id))

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
              <div className="flex gap-2">
                <Button onClick={handleCreate} className="flex-1 bg-blue-600 hover:bg-blue-700 gap-1.5 text-sm"><Send size={14} />Save as Draft</Button>
                <Button variant="outline" onClick={() => setShowCreate(false)} className="text-sm">Cancel</Button>
              </div>
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
                  <span className="flex items-center gap-1"><Clock size={11} />{a.sentAt}</span>
                  {a.views > 0 && <span className="flex items-center gap-1"><Eye size={11} />{a.views.toLocaleString()} views</span>}
                </div>
              </div>
              <div className="flex sm:flex-col gap-2 flex-shrink-0">
                {a.status === "draft" && <Button size="sm" onClick={() => handleSend(a.id)} className="gap-1 text-xs bg-blue-600 hover:bg-blue-700"><Send size={12} />Send</Button>}
                {a.status === "scheduled" && <Button size="sm" onClick={() => handleSend(a.id)} className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700"><Send size={12} />Send Now</Button>}
                <Button size="sm" variant="outline" onClick={() => handleDelete(a.id)} className="gap-1 text-xs text-red-600 border-red-200 hover:bg-red-50"><Trash2 size={12} /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
