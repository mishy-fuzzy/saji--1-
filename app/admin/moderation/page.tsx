"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Eye, Trash2, CheckCircle2, XCircle, AlertTriangle, Flag, Search, ImageIcon, MessageSquare, FileText } from "lucide-react"
import { apiRequest } from "@/lib/api/client"

type ModerationItem = {
  id: string
  kind: "verification" | "dispute"
  type: string
  user: string
  content: string
  reason: string
  severity: "high" | "medium" | "low"
  time: string
  reports: number
  createdAt: string
}

type ModerationResponse = {
  ok: boolean
  items: ModerationItem[]
  metrics: {
    pendingReview: number
    resolvedToday: number
    autoFlagged: number
    userReports: number
    urgent: number
    total: number
  }
}

export default function AdminModerationPage() {
  const [items, setItems] = useState<ModerationItem[]>([])
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [metrics, setMetrics] = useState<ModerationResponse["metrics"]>({
    pendingReview: 0,
    resolvedToday: 0,
    autoFlagged: 0,
    userReports: 0,
    urgent: 0,
    total: 0,
  })

  const loadQueue = async () => {
    try {
      setLoadError("")
      const payload = await apiRequest<ModerationResponse>("/api/admin/moderation", { method: "GET" })
      setItems(payload.items)
      setMetrics(payload.metrics)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load moderation queue"
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadQueue()
  }, [])

  const filtered = items.filter(i => {
    if (filter !== "all" && i.severity !== filter) return false
    if (search && !i.content.toLowerCase().includes(search.toLowerCase()) && !i.user.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleAction = async (item: ModerationItem, action: "approve" | "remove") => {
    await apiRequest("/api/admin/moderation", {
      method: "PATCH",
      body: {
        kind: item.kind,
        id: item.id,
        action,
      },
    })

    setItems((prev) => prev.filter((current) => current.id !== item.id))
    setMetrics((prev) => ({
      ...prev,
      pendingReview: Math.max(0, prev.pendingReview - 1),
      total: Math.max(0, prev.total - 1),
      urgent: item.severity === "high" ? Math.max(0, prev.urgent - 1) : prev.urgent,
      resolvedToday: prev.resolvedToday + 1,
    }))
  }

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
          <span className="px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-semibold">{metrics.urgent} urgent</span>
          <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-semibold">{metrics.total} total</span>
        </div>
      </div>

      {loadError && <Card className="p-4 text-sm text-red-600">{loadError}</Card>}

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Pending Review", value: String(metrics.pendingReview), icon: Shield, color: "text-blue-600" },
          { label: "Resolved Today", value: String(metrics.resolvedToday), icon: CheckCircle2, color: "text-emerald-600" },
          { label: "Auto-Flagged", value: String(metrics.autoFlagged), icon: AlertTriangle, color: "text-amber-600" },
          { label: "User Reports", value: String(metrics.userReports), icon: Flag, color: "text-red-600" },
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
        {isLoading && (
          <Card className="p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading moderation queue...</p>
          </Card>
        )}
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
                <Button size="sm" variant="outline" onClick={() => handleAction(item, "approve")} className="gap-1 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-900/20"><CheckCircle2 size={14} />Approve</Button>
                <Button size="sm" variant="outline" onClick={() => handleAction(item, "remove")} className="gap-1 text-xs text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"><Trash2 size={14} />Remove</Button>
              </div>
            </div>
          </Card>
        ))}
        {!isLoading && filtered.length === 0 && (
          <Card className="p-8 text-center">
            <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">All content has been reviewed</p>
          </Card>
        )}
      </div>
    </div>
  )
}
