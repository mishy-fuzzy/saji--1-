"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, BarChart3, TrendingUp, RefreshCw, X } from "lucide-react"

export default function ReportsPage() {
  const [reports, setReports] = useState([
    { id: 1, name: "Q1 Performance Summary", createdBy: "Admin", date: "Jan 10", status: "Ready", type: "Performance" },
    { id: 2, name: "Agent Productivity Analysis", createdBy: "Admin", date: "Jan 5", status: "Ready", type: "Productivity" },
  ])

  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [generatingReport, setGeneratingReport] = useState(false)

  const reportTemplates = [
    { title: "Agent Performance Report", description: "Monthly performance metrics for all agents", icon: "📊", type: "performance" },
    { title: "Financial Summary", description: "Commission payouts and financial overview", icon: "💰", type: "financial" },
    { title: "Dispute Resolution Report", description: "Dispute statistics and resolutions", icon: "⚖️", type: "disputes" },
    { title: "Customer Satisfaction Report", description: "Customer feedback and satisfaction scores", icon: "😊", type: "satisfaction" },
  ]

  const handleGenerateReport = (reportType: string) => {
    console.log("[v0] Generating report type:", reportType)
    setGeneratingReport(true)

    // Simulate report generation
    setTimeout(() => {
      const newReport = {
        id: reports.length + 1,
        name: `${reportType} Report - ${new Date().toLocaleDateString()}`,
        createdBy: "Admin",
        date: new Date().toLocaleDateString(),
        status: "Ready",
        type: reportType,
        data: { generatedAt: new Date().toISOString(), type: reportType }
      }
      setReports([newReport, ...reports])
      setGeneratingReport(false)
      setShowGenerateModal(false)
      console.log("[v0] Report generated successfully:", newReport)
    }, 2000)
  }

  const handleDownloadReport = (report: any) => {
    console.log("[v0] Downloading report:", report.id)
    const data = {
      reportName: report.name,
      type: report.type,
      createdBy: report.createdBy,
      date: report.date,
      generatedAt: new Date().toISOString(),
      data: {
        agentStats: {
          totalAgents: 142,
          activeAgents: 135,
          averageRating: 4.7,
          topPerformer: "Daniel K.",
        },
        financialData: {
          totalCommissions: "KES 450,000",
          totalPayouts: "KES 400,000",
          pendingPayouts: "KES 50,000",
        },
        disputeStats: {
          totalDisputes: 127,
          resolvedDisputes: 119,
          pendingDisputes: 8,
          resolutionRate: "93.7%",
        }
      }
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${report.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
    console.log("[v0] Report downloaded successfully")
  }

  const handleDeleteReport = (reportId: number) => {
    if (confirm("Are you sure you want to delete this report?")) {
      setReports(reports.filter(r => r.id !== reportId))
      console.log("[v0] Report deleted:", reportId)
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
        {reports.length === 0 ? (
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
