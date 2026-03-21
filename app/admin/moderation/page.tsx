"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Eye, Trash2, CheckCircle2, XCircle, AlertTriangle, Flag, Search, ImageIcon, MessageSquare, FileText } from "lucide-react"

const flaggedContent = [
  { id: 1, type: "post", user: "Provider - Mike Ochieng", content: "Offering 'special services' at discounted rates tonight...", reason: "Potentially inappropriate", severity: "high", time: "10 min ago", reports: 5 },
  { id: 2, type: "image", user: "Shopkeeper - Quick Mart", content: "Product image with misleading pricing overlay", reason: "Misleading content", severity: "medium", time: "25 min ago", reports: 3 },
  { id: 3, type: "review", user: "Customer - Anonymous", content: "This provider is a SCAM!!! Dont use them they will steal your money!!!", reason: "Hate speech / defamation", severity: "high", time: "1h ago", reports: 8 },
  { id: 4, type: "post", user: "Provider - Jane Wambui", content: "Copy of competitor's before/after photos used as own work", reason: "Copyright / stolen content", severity: "medium", time: "2h ago", reports: 2 },
  { id: 5, type: "message", user: "Customer - John Doe", content: "Sending repeated unsolicited messages to multiple providers", reason: "Spam / harassment", severity: "high", time: "3h ago", reports: 12 },
  { id: 6, type: "post", user: "Provider - Alex Kamau", content: "Live stream with background music (copyrighted)", reason: "Copyright violation", severity: "low", time: "5h ago", reports: 1 },
  { id: 7, type: "review", user: "Customer - Mary K.", content: "Fake 5-star review (user never booked this service)", reason: "Fake review", severity: "medium", time: "6h ago", reports: 4 },
  { id: 8, type: "image", user: "Shopkeeper - CBD Electronics", content: "Product listing using stock photos not matching actual product", reason: "Misleading product imagery", severity: "low", time: "8h ago", reports: 2 },
]

export default function AdminModerationPage() {
  const [items, setItems] = useState(flaggedContent)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")

  const filtered = items.filter(i => {
    if (filter !== "all" && i.severity !== filter) return false
    if (search && !i.content.toLowerCase().includes(search.toLowerCase()) && !i.user.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleApprove = (id: number) => setItems(prev => prev.filter(i => i.id !== id))
  const handleRemove = (id: number) => setItems(prev => prev.filter(i => i.id !== id))

  const sevColor = (s: string) => {
    switch (s) {
      case "high": return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
      case "medium": return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
      default: return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
    }
  }

  const typeIcon = (t: string) => {
    switch (t) {
      case "image": return <ImageIcon size={14} />
      case "review": return <MessageSquare size={14} />
      case "message": return <MessageSquare size={14} />
      default: return <FileText size={14} />
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Content Moderation</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review and act on flagged content across the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-semibold">{items.filter(i => i.severity === "high").length} urgent</span>
          <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-semibold">{items.length} total</span>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Pending Review", value: items.length.toString(), icon: Shield, color: "text-blue-600" },
          { label: "Resolved Today", value: "23", icon: CheckCircle2, color: "text-emerald-600" },
          { label: "Auto-Flagged", value: "5", icon: AlertTriangle, color: "text-amber-600" },
          { label: "User Reports", value: "37", icon: Flag, color: "text-red-600" },
        ].map((s, i) => (
          <Card key={i} className="p-4 flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center ${s.color} flex-shrink-0`}><s.icon size={18} /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 flex-1">
          <Search size={16} className="text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search flagged content..." className="bg-transparent text-sm outline-none flex-1 text-gray-700 dark:text-gray-200 placeholder:text-gray-400" />
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
          {["all", "high", "medium", "low"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${filter === f ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm" : "text-gray-500"}`}>
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Content Items */}
      <div className="space-y-3">
        {filtered.map(item => (
          <Card key={item.id} className={`p-4 ${item.severity === "high" ? "border-l-3 border-l-red-500" : ""}`}>
            <div className="flex flex-col sm:flex-row sm:items-start gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${item.severity === "high" ? "bg-red-100 dark:bg-red-900/30 text-red-600" : item.severity === "medium" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600" : "bg-blue-100 dark:bg-blue-900/30 text-blue-600"}`}>
                {typeIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{item.user}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${sevColor(item.severity)}`}>{item.severity}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 capitalize">{item.type}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-1 leading-relaxed">{item.content}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Reason: {item.reason}</p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
                  <span>{item.time}</span>
                  <span>{item.reports} reports</span>
                </div>
              </div>
              <div className="flex sm:flex-col gap-2 flex-shrink-0">
                <Button size="sm" variant="outline" onClick={() => handleApprove(item.id)} className="gap-1 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-900/20"><CheckCircle2 size={14} />Approve</Button>
                <Button size="sm" variant="outline" onClick={() => handleRemove(item.id)} className="gap-1 text-xs text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"><Trash2 size={14} />Remove</Button>
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="p-8 text-center">
            <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">All content has been reviewed</p>
          </Card>
        )}
      </div>
    </div>
  )
}
