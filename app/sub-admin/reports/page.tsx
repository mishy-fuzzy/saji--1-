"use client"

import { useEffect, useMemo, useState } from "react"
import { Calendar, CheckCircle, Clock, Download, FileText, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type ReportItem = {
  id: string
  name: string
  type: string
  status: string
  createdBy: string
  date: string
  data?: Record<string, unknown>
}

export default function SubAdminReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([])
  const [filter, setFilter] = useState("All")
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const loadReports = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/reports?scope=subadmin", {
          cache: "no-store",
          headers: {
            "x-user-role": "sub-admin",
          },
          signal: controller.signal,
        })
        const payload = await response.json()

        if (!response.ok || !payload?.ok || !Array.isArray(payload?.data)) {
          throw new Error(payload?.error || "Failed to load reports")
        }

        setReports(
          payload.data.map((row: Partial<ReportItem>) => ({
            id: String(row.id || ""),
            name: String(row.name || "Generated Report"),
            type: String(row.type || "general"),
            status: String(row.status || "Ready"),
            createdBy: String(row.createdBy || "System"),
            date: String(row.date || ""),
            data: row.data || {},
          })),
        )
      } catch (err) {
        if (controller.signal.aborted) return
        const message = err instanceof Error ? err.message : "Failed to load reports"
        setError(message)
        setReports([])
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadReports()
    const intervalId = window.setInterval(loadReports, 30000)

    return () => {
      controller.abort()
      window.clearInterval(intervalId)
    }
  }, [])

  const types = useMemo(() => {
    const uniqueTypes = Array.from(new Set(reports.map((report) => report.type)))
    return ["All", ...uniqueTypes]
  }, [reports])

  const filtered = useMemo(() => {
    return filter === "All" ? reports : reports.filter((report) => report.type === filter)
  }, [filter, reports])

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "sub-admin",
        },
        body: JSON.stringify({
          scope: "subadmin",
          type: filter === "All" ? "general" : filter,
        }),
      })
      const payload = await response.json()

      if (!response.ok || !payload?.ok || !payload?.data) {
        throw new Error(payload?.error || "Failed to generate report")
      }

      setReports((prev) => [payload.data as ReportItem, ...prev])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate report"
      setError(message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDeleteReport = async (id: string) => {
    const confirmed = window.confirm("Delete this report from the database?")
    if (!confirmed) return

    try {
      const response = await fetch(`/api/reports?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
          "x-user-role": "sub-admin",
        },
      })
      const payload = await response.json()

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Failed to delete report")
      }

      setReports((prev) => prev.filter((report) => report.id !== id))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete report"
      setError(message)
    }
  }

  const handleDownload = (report: ReportItem) => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${report.name.toLowerCase().replace(/\s+/g, "-")}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Generated reports and export tools backed by the database</p>
        </div>
        <Button onClick={handleGenerateReport} disabled={isGenerating} className="bg-blue-600 hover:bg-blue-700 gap-2 text-sm">
          <FileText size={16} /> {isGenerating ? "Generating..." : "Generate New Report"}
        </Button>
      </div>

      {error ? (
        <Card className="p-4 border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm">
          Failed to update reports: {error}
        </Card>
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${
              filter === type
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <Card className="p-4 border-0 shadow-sm text-sm text-gray-500 dark:text-gray-400">
            Loading reports from the database...
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-4 border-0 shadow-sm text-sm text-gray-500 dark:text-gray-400">
            No reports found.
          </Card>
        ) : (
          filtered.map((report) => (
            <Card key={report.id} className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{report.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">
                        {report.type}
                      </span>
                      <span className="text-[10px] text-gray-500">{report.date}</span>
                      <span className="text-[10px] text-gray-400">Created by {report.createdBy}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                    <CheckCircle size={10} /> {report.status}
                  </span>
                  <Button size="sm" variant="outline" className="bg-transparent gap-1 text-xs h-7" onClick={() => handleDownload(report)}>
                    <Download size={13} /> Download
                  </Button>
                  <Button size="sm" variant="outline" className="bg-transparent gap-1 text-xs h-7" onClick={() => handleDeleteReport(report.id)}>
                    <Trash2 size={13} /> Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <Clock size={14} /> Reports refresh automatically from the database.
      </div>
    </div>
  )
}
