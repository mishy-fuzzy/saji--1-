"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Search, Download, User, Shield, CreditCard, Settings, AlertTriangle, CheckCircle2, XCircle, Eye, Bookmark, BookmarkCheck, RotateCcw, Clock, Globe, Monitor, Filter } from "lucide-react"

interface LogEntry {
  id: number
  user: string
  role: string
  action: string
  target: string
  category: string
  severity: "info" | "warning" | "critical"
  time: string
  timestamp: string
  ip: string
  device: string
  location: string
  reversible: boolean
  reverted: boolean
  flagged: boolean
}

const initialLogs: LogEntry[] = [
  { id: 1, user: "Admin Sarah N.", role: "Admin", action: "Approved verification", target: "Provider James Mwangi (ID #4521)", category: "verification", severity: "info", time: "2 min ago", timestamp: "2026-02-21 14:32:05", ip: "192.168.1.45", device: "Chrome / macOS", location: "Nairobi, KE", reversible: true, reverted: false, flagged: false },
  { id: 2, user: "Sub-Admin Peter K.", role: "Sub-Admin", action: "Suspended account", target: "Shopkeeper FakeStore (ID #1102)", category: "user", severity: "warning", time: "15 min ago", timestamp: "2026-02-21 14:19:22", ip: "10.0.0.23", device: "Firefox / Windows", location: "Nairobi, KE", reversible: true, reverted: false, flagged: false },
  { id: 3, user: "System", role: "System", action: "Auto-flagged content", target: "Post #8821 - Inappropriate image detected", category: "moderation", severity: "warning", time: "32 min ago", timestamp: "2026-02-21 14:02:11", ip: "auto", device: "System", location: "Server", reversible: false, reverted: false, flagged: false },
  { id: 4, user: "Admin Sarah N.", role: "Admin", action: "Updated commission rate", target: "Provider tier changed from 12% to 10%", category: "settings", severity: "info", time: "1h ago", timestamp: "2026-02-21 13:30:44", ip: "192.168.1.45", device: "Chrome / macOS", location: "Nairobi, KE", reversible: true, reverted: false, flagged: false },
  { id: 5, user: "Secretary Jane A.", role: "Secretary", action: "Processed payout", target: "Batch #892 - KES 2.4M to 45 providers", category: "payment", severity: "info", time: "2h ago", timestamp: "2026-02-21 12:15:33", ip: "10.0.0.55", device: "Safari / macOS", location: "Nairobi, KE", reversible: false, reverted: false, flagged: false },
  { id: 6, user: "Agent Kevin O.", role: "Agent", action: "Resolved dispute", target: "Dispute #D-2045 in favor of customer", category: "dispute", severity: "info", time: "3h ago", timestamp: "2026-02-21 11:45:12", ip: "172.16.0.12", device: "Chrome / Android", location: "Mombasa, KE", reversible: true, reverted: false, flagged: false },
  { id: 7, user: "Sub-Admin Peter K.", role: "Sub-Admin", action: "Failed login attempt (3x)", target: "Account temporarily locked", category: "security", severity: "critical", time: "4h ago", timestamp: "2026-02-21 10:02:55", ip: "203.0.113.42", device: "Unknown", location: "Lagos, NG", reversible: false, reverted: false, flagged: true },
  { id: 8, user: "System", role: "System", action: "Database backup completed", target: "Full backup - 4.2GB stored", category: "system", severity: "info", time: "6h ago", timestamp: "2026-02-21 08:00:00", ip: "auto", device: "System", location: "Server", reversible: false, reverted: false, flagged: false },
  { id: 9, user: "Admin Sarah N.", role: "Admin", action: "Created announcement", target: "Platform maintenance scheduled for Feb 25", category: "settings", severity: "info", time: "8h ago", timestamp: "2026-02-21 06:45:22", ip: "192.168.1.45", device: "Chrome / macOS", location: "Nairobi, KE", reversible: true, reverted: false, flagged: false },
  { id: 10, user: "System", role: "System", action: "Unusual login detected", target: "Admin login from new location (Mombasa)", category: "security", severity: "critical", time: "12h ago", timestamp: "2026-02-21 02:12:08", ip: "41.89.12.100", device: "Chrome / Windows", location: "Mombasa, KE", reversible: false, reverted: false, flagged: true },
]

const categories = ["all", "verification", "user", "moderation", "settings", "payment", "dispute", "security", "system"]

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs)
  const [search, setSearch] = useState("")
  const [catFilter, setCatFilter] = useState("all")
  const [sevFilter, setSevFilter] = useState("all")
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false)
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showRevertConfirm, setShowRevertConfirm] = useState(false)

  const filtered = logs.filter(l => {
    if (catFilter !== "all" && l.category !== catFilter) return false
    if (sevFilter !== "all" && l.severity !== sevFilter) return false
    if (showFlaggedOnly && !l.flagged) return false
    if (search && !l.action.toLowerCase().includes(search.toLowerCase()) && !l.user.toLowerCase().includes(search.toLowerCase()) && !l.target.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const toggleFlag = (id: number) => {
    setLogs(prev => prev.map(l => l.id === id ? { ...l, flagged: !l.flagged } : l))
  }

  const handleRevert = () => {
    if (!selectedLog) return
    setLogs(prev => prev.map(l => l.id === selectedLog.id ? { ...l, reverted: true } : l))
    setShowRevertConfirm(false)
    setShowDetailModal(false)
  }

  const openDetail = (log: LogEntry) => {
    setSelectedLog(log)
    setShowDetailModal(true)
  }

  const sevBadge = (s: string) => {
    switch (s) {
      case "critical": return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
      case "warning": return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
      default: return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
    }
  }

  const catIcon = (c: string) => {
    switch (c) {
      case "user": return <User size={14} />
      case "verification": return <CheckCircle2 size={14} />
      case "payment": return <CreditCard size={14} />
      case "settings": return <Settings size={14} />
      case "security": return <Shield size={14} />
      case "dispute": return <AlertTriangle size={14} />
      case "moderation": return <XCircle size={14} />
      default: return <Eye size={14} />
    }
  }

  const criticalCount = logs.filter(l => l.severity === "critical").length
  const flaggedCount = logs.filter(l => l.flagged).length

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Audit Log</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track all administrative actions across the platform</p>
        </div>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5 text-xs w-fit rounded-lg"><Download size={14} />Export CSV</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Events Today", value: "248", color: "text-blue-600" },
          { label: "Critical Alerts", value: criticalCount.toString(), color: "text-red-600" },
          { label: "Flagged Events", value: flaggedCount.toString(), color: "text-amber-600" },
          { label: "Active Admins", value: "4", color: "text-emerald-600" },
        ].map((s, i) => (
          <Card key={i} className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color} mt-1`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 flex-1">
          <Search size={16} className="text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search actions, users, targets..." className="bg-transparent text-sm outline-none flex-1 text-gray-700 dark:text-gray-200 placeholder:text-gray-400" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 outline-none">
            {categories.map(c => <option key={c} value={c}>{c === "all" ? "All Categories" : c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
          <select value={sevFilter} onChange={e => setSevFilter(e.target.value)} className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 outline-none">
            <option value="all">All Severity</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
          <button onClick={() => setShowFlaggedOnly(!showFlaggedOnly)} className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-colors ${showFlaggedOnly ? "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"}`}>
            <BookmarkCheck size={14} />
            Flagged Only
          </button>
        </div>
      </div>

      {/* Logs */}
      <Card className="overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
          {filtered.map(log => (
            <div key={log.id} className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 flex items-start gap-3 transition-colors ${log.severity === "critical" ? "border-l-[3px] border-l-red-500" : ""} ${log.reverted ? "opacity-50" : ""}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${log.severity === "critical" ? "bg-red-100 dark:bg-red-900/30 text-red-600" : log.severity === "warning" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600" : "bg-gray-100 dark:bg-gray-700 text-gray-500"}`}>
                {catIcon(log.category)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{log.user}</span>
                  <span className="text-xs text-gray-400">{log.action}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${sevBadge(log.severity)}`}>{log.severity}</span>
                  {log.reverted && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-500">Reverted</span>}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 truncate">{log.target}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-gray-400">{log.time}</span>
                  <span className="text-[10px] text-gray-400 font-mono">IP: {log.ip}</span>
                  <span className="text-[10px] text-gray-400">{log.location}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => toggleFlag(log.id)} className={`p-1.5 rounded-lg transition-colors ${log.flagged ? "text-amber-500 hover:text-amber-600" : "text-gray-300 hover:text-amber-500"}`} title={log.flagged ? "Unflag" : "Flag event"}>
                  {log.flagged ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                </button>
                <button onClick={() => openDetail(log)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 transition-colors" title="View details">
                  <Eye size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && <div className="p-8 text-center text-sm text-gray-400">No audit events match the filters</div>}
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>Full audit trail information for this event.</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedLog.severity === "critical" ? "bg-red-100 dark:bg-red-900/30 text-red-600" : selectedLog.severity === "warning" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600" : "bg-blue-100 dark:bg-blue-900/30 text-blue-600"}`}>
                  {catIcon(selectedLog.category)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">{selectedLog.action}</h3>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${sevBadge(selectedLog.severity)}`}>{selectedLog.severity}</span>
                  {selectedLog.reverted && <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-500">Reverted</span>}
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { icon: User, label: "Performed by", value: `${selectedLog.user} (${selectedLog.role})` },
                  { icon: Eye, label: "Target", value: selectedLog.target },
                  { icon: Clock, label: "Timestamp", value: selectedLog.timestamp },
                  { icon: Globe, label: "IP Address", value: selectedLog.ip },
                  { icon: Monitor, label: "Device", value: selectedLog.device },
                  { icon: Globe, label: "Location", value: selectedLog.location },
                  { icon: Filter, label: "Category", value: selectedLog.category.charAt(0).toUpperCase() + selectedLog.category.slice(1) },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2.5">
                    <item.icon size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">{item.label}</p>
                      <p className="text-sm text-gray-900 dark:text-white break-words">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <DialogFooter className="gap-2 flex-col sm:flex-row">
                <Button variant="outline" onClick={() => { toggleFlag(selectedLog.id); setSelectedLog({ ...selectedLog, flagged: !selectedLog.flagged }) }} className={`rounded-lg gap-1.5 ${selectedLog.flagged ? "text-amber-600 border-amber-300" : ""}`}>
                  {selectedLog.flagged ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                  {selectedLog.flagged ? "Unflag" : "Flag Event"}
                </Button>
                {selectedLog.reversible && !selectedLog.reverted && (
                  <Button onClick={() => setShowRevertConfirm(true)} className="bg-amber-600 hover:bg-amber-700 rounded-lg gap-1.5">
                    <RotateCcw size={14} />Revert Action
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowDetailModal(false)} className="rounded-lg">Close</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Revert Confirmation */}
      <Dialog open={showRevertConfirm} onOpenChange={setShowRevertConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Revert Action</DialogTitle>
            <DialogDescription>This will undo the selected administrative action.</DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-3">
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Revert "{selectedLog?.action}"?</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">This will reverse the action performed by {selectedLog?.user}. A new audit event will be logged recording this revert.</p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowRevertConfirm(false)} className="rounded-lg">Cancel</Button>
              <Button onClick={handleRevert} className="bg-amber-600 hover:bg-amber-700 rounded-lg gap-1.5"><RotateCcw size={14} />Confirm Revert</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
