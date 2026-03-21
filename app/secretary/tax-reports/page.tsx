"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileSpreadsheet, Calendar, Filter, Eye, Printer, ArrowUpRight, AlertCircle, CheckCircle2 } from "lucide-react"

const reports = [
  { id: "TR-2026-Q4", period: "Q4 2025", type: "Quarterly", status: "Filed", dueDate: "Jan 31, 2026", filedDate: "Jan 28, 2026", amount: "KES 4.2M", taxDue: "KES 672K" },
  { id: "TR-2026-Q1", period: "Q1 2026", type: "Quarterly", status: "Draft", dueDate: "Apr 30, 2026", filedDate: "-", amount: "KES 5.1M", taxDue: "KES 816K" },
  { id: "TR-2025-AN", period: "FY 2025", type: "Annual", status: "Filed", dueDate: "Mar 31, 2026", filedDate: "Mar 15, 2026", amount: "KES 18.6M", taxDue: "KES 2.98M" },
  { id: "TR-2026-M01", period: "Jan 2026", type: "Monthly VAT", status: "Filed", dueDate: "Feb 20, 2026", filedDate: "Feb 18, 2026", amount: "KES 1.8M", taxDue: "KES 288K" },
  { id: "TR-2026-M02", period: "Feb 2026", type: "Monthly VAT", status: "Pending", dueDate: "Mar 20, 2026", filedDate: "-", amount: "KES 1.6M", taxDue: "KES 256K" },
  { id: "TR-2026-PAYE01", period: "Jan 2026", type: "PAYE", status: "Filed", dueDate: "Feb 9, 2026", filedDate: "Feb 7, 2026", amount: "KES 890K", taxDue: "KES 267K" },
  { id: "TR-2026-PAYE02", period: "Feb 2026", type: "PAYE", status: "Overdue", dueDate: "Mar 9, 2026", filedDate: "-", amount: "KES 920K", taxDue: "KES 276K" },
]

const taxSummary = [
  { label: "Total Tax Filed (YTD)", value: "KES 5.27M", change: "+12%" },
  { label: "Pending Filings", value: "2", change: "Due soon" },
  { label: "Next Deadline", value: "Mar 9", change: "PAYE" },
  { label: "Compliance Score", value: "94%", change: "Good" },
]

export default function SecretaryTaxReportsPage() {
  const [filter, setFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [localReports, setLocalReports] = useState(reports)

  const filtered = localReports.filter(r => {
    if (filter !== "all" && r.status.toLowerCase() !== filter) return false
    if (typeFilter !== "all" && r.type !== typeFilter) return false
    return true
  })

  const handleGenerateReport = () => {
    const newReport = {
      id: `TR-${new Date().getFullYear()}-NEW-${String(localReports.length + 1).padStart(2, "0")}`,
      period: "Current Period",
      type: "Monthly VAT",
      status: "Draft",
      dueDate: "TBD",
      filedDate: "-",
      amount: "KES 0",
      taxDue: "KES 0",
    }
    setLocalReports((prev) => [newReport, ...prev])
  }

  const handleViewReport = (id: string) => {
    alert(`Opening report ${id}`)
  }

  const handleDownloadReport = (id: string) => {
    const report = localReports.find((item) => item.id === id)
    if (!report) return
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${id}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handlePrintReport = (id: string) => {
    alert(`Preparing ${id} for print...`)
    window.print()
  }

  const statusColor = (s: string) => {
    switch (s) {
      case "Filed": return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
      case "Draft": return "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
      case "Pending": return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
      case "Overdue": return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
      default: return "bg-gray-100 text-gray-600"
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Tax Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage tax filings, VAT, PAYE, and compliance</p>
        </div>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5 text-xs w-fit" onClick={handleGenerateReport}>
          <FileSpreadsheet size={14} />
          Generate New Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {taxSummary.map((s, i) => (
          <Card key={i} className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{s.label}</p>
            <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            <p className={`text-xs mt-1 ${s.change.includes("+") ? "text-emerald-600" : s.change === "Due soon" ? "text-amber-600" : s.change === "Overdue" ? "text-red-600" : "text-blue-600"}`}>{s.change}</p>
          </Card>
        ))}
      </div>

      {/* Upcoming Deadlines Alert */}
      {reports.some(r => r.status === "Overdue") && (
        <Card className="p-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">Overdue Filing</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{reports.filter(r => r.status === "Overdue").map(r => `${r.type} for ${r.period} (due ${r.dueDate})`).join(", ")}. File immediately to avoid penalties.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
          {["all", "filed", "pending", "draft", "overdue"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${filter === f ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400"}`}>
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
          {["all", "Monthly VAT", "PAYE", "Quarterly", "Annual"].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${typeFilter === t ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400"}`}>
              {t === "all" ? "All Types" : t}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400 text-xs">Report ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400 text-xs">Period</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400 text-xs hidden sm:table-cell">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400 text-xs">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400 text-xs hidden md:table-cell">Tax Due</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400 text-xs hidden lg:table-cell">Due Date</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400 text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="py-3 px-4 font-mono text-xs font-medium text-gray-900 dark:text-white">{r.id}</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{r.period}</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300 hidden sm:table-cell">{r.type}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(r.status)}`}>
                      {r.status === "Filed" && <CheckCircle2 size={10} className="inline mr-1" />}
                      {r.status === "Overdue" && <AlertCircle size={10} className="inline mr-1" />}
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white hidden md:table-cell">{r.taxDue}</td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400 hidden lg:table-cell">{r.dueDate}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleViewReport(r.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500" title="View"><Eye size={14} /></button>
                      <button onClick={() => handleDownloadReport(r.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500" title="Download"><Download size={14} /></button>
                      <button onClick={() => handlePrintReport(r.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500" title="Print"><Printer size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-400">No reports match the selected filters</div>
        )}
      </Card>
    </div>
  )
}
