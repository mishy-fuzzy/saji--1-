"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Users, MessageSquare, CheckCircle, TrendingUp, Calendar, Download, Filter, Eye, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchAgentDashboard } from "@/lib/services/agent-dashboard-service"
import type { AgentDashboardResponse, AgentDisputeItem } from "@/lib/contracts/agent-dashboard"

export default function AgentDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("week")
  const [selectedDispute, setSelectedDispute] = useState<AgentDisputeItem | null>(null)
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [showOpenOnly, setShowOpenOnly] = useState(false)
  const [disputes, setDisputes] = useState<AgentDisputeItem[]>([])
  const [dashboard, setDashboard] = useState<AgentDashboardResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        setIsLoading(true)
        const payload = await fetchAgentDashboard()
        if (!mounted) return
        setDashboard(payload)
        setDisputes(payload.disputes)
        setLoadError("")
      } catch (error) {
        if (!mounted) return
        setLoadError(error instanceof Error ? error.message : "Failed to load agent dashboard")
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  const stats = useMemo(
    () => [
      { icon: AlertTriangle, label: "Open Disputes", value: String(dashboard?.stats.openDisputes ?? 0), color: "bg-red-100 dark:bg-red-900", trend: "Live" },
      { icon: Users, label: "Customers Helped", value: String(dashboard?.stats.customersHelped ?? 0), color: "bg-blue-100 dark:bg-blue-900", trend: "Live" },
      { icon: MessageSquare, label: "Pending Queries", value: String(dashboard?.stats.pendingQueries ?? 0), color: "bg-yellow-100 dark:bg-yellow-900", trend: "Live" },
      { icon: CheckCircle, label: "Resolved Today", value: String(dashboard?.stats.resolvedToday ?? 0), color: "bg-green-100 dark:bg-green-900", trend: "Live" },
    ],
    [dashboard],
  )

  const performanceMetrics = dashboard?.performanceMetrics ?? []
  const recentActivity = dashboard?.recentActivity ?? []

  const handleViewDispute = (dispute: AgentDisputeItem) => {
    setSelectedDispute(dispute)
    setShowDisputeModal(true)
  }

  const handleExportReport = () => {
    const data = {
      exportDate: new Date().toISOString(),
      agentId: "AGT-001",
      period: selectedPeriod,
      stats: {
        openDisputes: Number(stats[0].value),
        customersHelped: Number(stats[1].value),
        pendingQueries: Number(stats[2].value),
        resolvedToday: Number(stats[3].value),
      },
      performance: performanceMetrics,
      disputes,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `agent-report-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleUpdateDisputeStatus = () => {
    if (!selectedDispute) return

    setDisputes((prev) =>
      prev.map((item) =>
        item.id === selectedDispute.id
          ? {
              ...item,
              status: item.status === "Open" ? "In Progress" : "Resolved",
              resolution: item.status === "Open" ? "Escalated and under review" : "Resolved Successfully",
            }
          : item,
      ),
    )

    setSelectedDispute((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        status: prev.status === "Open" ? "In Progress" : "Resolved",
        resolution: prev.status === "Open" ? "Escalated and under review" : "Resolved Successfully",
      }
    })
  }

  const visibleDisputes = showOpenOnly ? disputes.filter((dispute) => dispute.status === "Open") : disputes

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Agent Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Track disputes, queries, and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportReport} className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Download size={18} />
            Export Report
          </Button>
        </div>
      </div>

      {loadError && (
        <Card className="p-4 border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 text-red-700 dark:text-red-300">
          {loadError}
        </Card>
      )}

      {/* Period Selector */}
      <div className="flex gap-2">
        {['day', 'week', 'month'].map(period => (
          <Button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            variant={selectedPeriod === period ? "default" : "outline"}
            className={selectedPeriod === period ? "bg-blue-600 hover:bg-blue-700" : "bg-transparent"}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{isLoading ? "..." : stat.value}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">{stat.trend}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="disputes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="disputes">Active Disputes</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        {/* Disputes Tab */}
        <TabsContent value="disputes" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Active Disputes</h2>
              <Button variant="outline" className="bg-transparent gap-2" onClick={() => setShowOpenOnly((prev) => !prev)}>
                <Filter size={18} />
                {showOpenOnly ? "All" : "Open"}
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Provider</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Customer</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Severity</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {visibleDisputes.length === 0 && !isLoading && (
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-500" colSpan={7}>No disputes found.</td>
                    </tr>
                  )}
                  {visibleDisputes.map(dispute => (
                    <tr key={dispute.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{dispute.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{dispute.provider}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{dispute.customer}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          dispute.status === "Open" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" :
                          dispute.status === "In Progress" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" :
                          "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        }`}>
                          {dispute.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          dispute.severity === "High" ? "text-red-600" :
                          dispute.severity === "Medium" ? "text-yellow-600" :
                          "text-blue-600"
                        }`}>
                          {dispute.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{dispute.amount}</td>
                      <td className="px-6 py-4 text-sm">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1" onClick={() => handleViewDispute(dispute)}>
                          <Eye size={16} />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {performanceMetrics.map((metric, idx) => (
              <Card key={idx} className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{metric.label}</h3>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{metric.value}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Benchmark: {metric.benchmark}</p>
                  </div>
                  <div className="h-16 w-16 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.length === 0 && !isLoading && (
                <p className="text-sm text-gray-500">No recent activity yet.</p>
              )}
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                  <div className={`w-3 h-3 rounded-full mt-2 ${
                    activity.type === "dispute_resolved" ? "bg-green-600" :
                    activity.type === "query_answered" ? "bg-blue-600" :
                    activity.type === "escalation" ? "bg-red-600" :
                    "bg-yellow-600"
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-gray-900 dark:text-white font-medium">{activity.description}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dispute Details Modal */}
      {showDisputeModal && selectedDispute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dispute Details</h2>
                <button
                  onClick={() => setShowDisputeModal(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Dispute ID</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedDispute.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Provider</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedDispute.provider}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Customer</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedDispute.customer}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Description</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedDispute.description}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedDispute.amount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedDispute.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Resolution</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedDispute.resolution}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setShowDisputeModal(false)}
                >
                  Close
                </Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleUpdateDisputeStatus}>Update Status</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
