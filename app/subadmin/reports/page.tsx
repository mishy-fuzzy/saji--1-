"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, BarChart3, TrendingUp, RefreshCw, X } from "lucide-react"

type ReportItem = {
  id: string
  name: string
  createdBy: string
  date: string
  status: string
  type: string
  data?: unknown
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([])

  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [loadingReports, setLoadingReports] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reportTemplates = [
    { title: "Agent Performance Report", description: "Monthly performance metrics for all agents", icon: "📊", type: "performance" },
    { title: "Financial Summary", description: "Commission payouts and financial overview", icon: "💰", type: "financial" },
    { title: "Dispute Resolution Report", description: "Dispute statistics and resolutions", icon: "⚖️", type: "disputes" },
    { title: "Customer Satisfaction Report", description: "Customer feedback and satisfaction scores", icon: "😊", type: "satisfaction" },
  ]

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/reports?scope=subadmin", {
        cache: "no-store",
        headers: {
          "x-user-role": "subadmin",
        },
      })
      const payload = await response.json()
      if (!response.ok || !payload?.ok || !Array.isArray(payload?.data)) {
        throw new Error(payload?.error || "Failed to load reports")
      }

      setReports(payload.data)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load reports"
      setError(message)
    } finally {
      setLoadingReports(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const handleGenerateReport = async (reportType: string) => {
    setGeneratingReport(true)

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "subadmin",
        },
        body: JSON.stringify({
          scope: "subadmin",
          type: reportType,
        }),
      })
      const payload = await response.json()

      if (!response.ok || !payload?.ok || !payload?.data) {
        throw new Error(payload?.error || "Failed to generate report")
      }

      setReports((prev) => [payload.data, ...prev])
      setError(null)
      setShowGenerateModal(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate report"
      setError(message)
    } finally {
      setGeneratingReport(false)
    }
  }

  const handleDownloadReport = (report: ReportItem) => {
    const data = {
      reportName: report.name,
      type: report.type,
      createdBy: report.createdBy,
      date: report.date,
      generatedAt: new Date().toISOString(),
      data: report.data || {},
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${report.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return

    try {
      const response = await fetch(`/api/reports?id=${encodeURIComponent(reportId)}`, {
        method: "DELETE",
        headers: {
          "x-user-role": "subadmin",
        },
      })
      const payload = await response.json()

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Failed to delete report")
      }

      setReports((prev) => prev.filter((r) => r.id !== reportId))
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete report"
      setError(message)
    }
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Generate and download comprehensive reports</p>
        </div>
        <Button onClick={() => setShowGenerateModal(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <BarChart3 size={18} />
          Generate Report
        </Button>
      </div>

      {error ? (
        <Card className="p-3 border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm">
          {error}
        </Card>
      ) : null}

      {/* Report Templates */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Available Report Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reportTemplates.map((report, idx) => (
            <Card
              key={idx}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                handleGenerateReport(report.type)
                setShowGenerateModal(false)
              }}
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl">{report.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{report.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{report.description}</p>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleGenerateReport(report.type)
                    }}
                    disabled={generatingReport}
                  >
                    {generatingReport ? "Generating..." : "Generate"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Generated Reports */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Generated Reports ({reports.length})</h2>
        {loadingReports ? (
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">Loading reports...</p>
        ) : reports.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">No reports generated yet. Create one to get started.</p>
        ) : (
          <div className="space-y-3">
            {reports.map(report => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{report.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Type: {report.type} • Created by {report.createdBy} on {report.date}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                    {report.status}
                  </span>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 gap-1"
                    onClick={() => handleDownloadReport(report)}
                  >
                    <Download size={16} />
                    Download
                  </Button>
                  <button
                    onClick={() => handleDeleteReport(report.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Select Report Type</h2>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="space-y-2">
                {reportTemplates.map((template, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleGenerateReport(template.type)}
                    disabled={generatingReport}
                    className="w-full p-3 text-left border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <span>{template.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{template.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{template.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {generatingReport && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <RefreshCw className="animate-spin w-5 h-5 text-blue-600" />
                  <span className="text-gray-700 dark:text-gray-300">Generating report...</span>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => setShowGenerateModal(false)}
                disabled={generatingReport}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
