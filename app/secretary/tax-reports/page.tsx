"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileSpreadsheet, Eye, Printer, AlertCircle, CheckCircle2 } from "lucide-react"

type TaxReport = {
  id: string
  period: string
  type: string
  status: string
  dueDate: string
  filedDate: string
  amount: string
  taxDue: string
}

const reports: TaxReport[] = []

const taxSummary: Array<{ label: string; value: string; change: string }> = [
  { label: "Total Tax Filed (YTD)", value: "KES 0", change: "No data" },
  { label: "Pending Filings", value: "0", change: "No data" },
  { label: "Next Deadline", value: "N/A", change: "No data" },
  { label: "Compliance Score", value: "N/A", change: "No data" },
]

export default function SecretaryTaxReportsPage() {
  const [filter, setFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [localReports, setLocalReports] = useState<TaxReport[]>(reports)
  const [summary, setSummary] = useState(taxSummary)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadReports = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/secretary/tax-reports", {
        cache: "no-store",
      })
      const payload = await response.json()

      if (!response.ok || !payload?.ok || !payload?.data) {
        throw new Error(payload?.error || "Failed to load tax reports")
      }

      setLocalReports(
        Array.isArray(payload.data.reports)
          ? payload.data.reports.map((item: Partial<TaxReport>) => ({
              id: String(item.id || ""),
              period: String(item.period || "N/A"),
              type: String(item.type || "Monthly VAT"),
              status: String(item.status || "Draft"),
              dueDate: String(item.dueDate || "TBD"),
              filedDate: String(item.filedDate || "-"),
              amount: String(item.amount || "KES 0"),
              taxDue: String(item.taxDue || "KES 0"),
            }))
          : [],
      )

      setSummary(
        Array.isArray(payload.data.summary) && payload.data.summary.length
          ? payload.data.summary.map((row: any) => ({
              label: String(row.label || ""),
              value: String(row.value || ""),
              change: String(row.change || ""),
            }))
          : taxSummary,
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load tax reports"
      setError(message)
      setLocalReports([])
      setSummary(taxSummary)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const reportTypes = useMemo(() => {
    return [
      "all",
      ...Array.from(
        new Set(localReports.map((item) => item.type).filter(Boolean)),
      ),
    ]
  }, [localReports])

  const filtered = useMemo(() => {
    return localReports.filter((r) => {
      if (filter !== "all" && r.status.toLowerCase() !== filter) return false
      if (typeFilter !== "all" && r.type !== typeFilter) return false
      return true
    })
  }, [filter, localReports, typeFilter])

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    setError(null)
    try {
      const response = await fetch("/api/secretary/tax-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "Monthly VAT" }),
      })
      const payload = await response.json()

      if (!response.ok || !payload?.ok || !payload?.data) {
        throw new Error(payload?.error || "Failed to generate report")
      }

      setLocalReports((prev) => [
        {
          id: String(payload.data.id),
          period: String(payload.data.period || "Current Period"),
          type: String(payload.data.type || "Monthly VAT"),
          status: String(payload.data.status || "Draft"),
          dueDate: String(payload.data.dueDate || "TBD"),
          filedDate: String(payload.data.filedDate || "-"),
          amount: String(payload.data.amount || "KES 0"),
          taxDue: String(payload.data.taxDue || "KES 0"),
        },
        ...prev,
      ])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate report"
      setError(message)
    } finally {
      setIsGenerating(false)
    }
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
          <Button disabled={isGenerating} size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5 text-xs w-fit" onClick={handleGenerateReport}>
          <FileSpreadsheet size={14} />
            {isGenerating ? "Generating..." : "Generate New Report"}
        </Button>
      </div>

        {error ? (
          <Card className="p-4 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-300">
            {error}
          </Card>
        ) : null}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {summary.map((s, i) => (
          <Card key={i} className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{s.label}</p>
            <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            <p className={`text-xs mt-1 ${s.change.includes("+") ? "text-emerald-600" : s.change === "Due soon" ? "text-amber-600" : s.change === "Overdue" ? "text-red-600" : "text-blue-600"}`}>{s.change}</p>
          </Card>
        ))}
      </div>

      {/* Upcoming Deadlines Alert */}
      {localReports.some(r => r.status === "Overdue") && (
        <Card className="p-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">Overdue Filing</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{localReports.filter(r => r.status === "Overdue").map(r => `${r.type} for ${r.period} (due ${r.dueDate})`).join(", ")}. File immediately to avoid penalties.</p>
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
          {reportTypes.map(t => (
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
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 px-4 text-center text-sm text-gray-500 dark:text-gray-400">Loading tax reports...</td>
                </tr>
              ) : null}
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
        {!isLoading && filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-400">No reports match the selected filters</div>
        )}
      </Card>
    </div>
  )
}
