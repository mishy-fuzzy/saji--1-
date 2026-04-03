"use client"

import { useEffect, useMemo, useState } from "react"
import { Clock, Download, DollarSign, Star, TrendingUp, Users } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type DashboardDispute = {
  id: string
  customer: string
  provider: string
  status: "Open" | "In Progress" | "Resolved"
  severity: "High" | "Medium" | "Low"
  amount: string
  date: string
  description: string
  resolution: string
}

type PerformanceMetric = {
  label: string
  value: string
  benchmark: string
}

type ActivityItem = {
  type: string
  description: string
  time: string
}

type ComparisonAgent = {
  rank: number
  name: string
  cases: number
  rating: number
  earnings: number
}

export default function AgentAnalyticsPage() {
  const [dashboardDisputes, setDashboardDisputes] = useState<DashboardDispute[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [comparisonAgents, setComparisonAgents] = useState<ComparisonAgent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const loadAnalytics = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [dashboardResponse, comparisonResponse] = await Promise.all([
          fetch("/api/agent/dashboard", {
            cache: "no-store",
            headers: {
              "x-user-role": "agent",
            },
            signal: controller.signal,
          }),
          fetch("/api/agent/analytics/comparison", {
            cache: "no-store",
            headers: {
              "x-user-role": "agent",
            },
            signal: controller.signal,
          }),
        ])

        const [dashboardPayload, comparisonPayload] = await Promise.all([
          dashboardResponse.json(),
          comparisonResponse.json(),
        ])

        if (!dashboardResponse.ok || !dashboardPayload?.ok) {
          throw new Error(dashboardPayload?.error || "Failed to load agent dashboard data")
        }

        if (!comparisonResponse.ok || !comparisonPayload?.ok || !Array.isArray(comparisonPayload?.data?.agents)) {
          throw new Error(comparisonPayload?.error || "Failed to load comparison data")
        }

        setDashboardDisputes(
          Array.isArray(dashboardPayload?.disputes)
            ? dashboardPayload.disputes.map((row: Partial<DashboardDispute>) => ({
                id: String(row.id || ""),
                customer: String(row.customer || "Unknown"),
                provider: String(row.provider || "Unassigned"),
                status: String(row.status || "Open") as DashboardDispute["status"],
                severity: String(row.severity || "Low") as DashboardDispute["severity"],
                amount: String(row.amount || "KES 0"),
                date: String(row.date || ""),
                description: String(row.description || "Dispute requires review"),
                resolution: String(row.resolution || "Pending"),
              }))
            : [],
        )

        setPerformanceMetrics(
          Array.isArray(dashboardPayload?.performanceMetrics)
            ? dashboardPayload.performanceMetrics.map((row: Partial<PerformanceMetric>) => ({
                label: String(row.label || "Metric"),
                value: String(row.value || "0"),
                benchmark: String(row.benchmark || "N/A"),
              }))
            : [],
        )

        setRecentActivity(
          Array.isArray(dashboardPayload?.recentActivity)
            ? dashboardPayload.recentActivity.map((row: Partial<ActivityItem>) => ({
                type: String(row.type || "update"),
                description: String(row.description || "Activity recorded"),
                time: String(row.time || "Now"),
              }))
            : [],
        )

        setComparisonAgents(
          comparisonPayload.data.agents.map((row: Partial<ComparisonAgent>) => ({
            rank: Number(row.rank || 0),
            name: String(row.name || "Agent"),
            cases: Number(row.cases || 0),
            rating: Number(row.rating || 0),
            earnings: Number(row.earnings || 0),
          })),
        )
      } catch (err) {
        if (controller.signal.aborted) return
        const message = err instanceof Error ? err.message : "Failed to load analytics"
        setError(message)
        setDashboardDisputes([])
        setPerformanceMetrics([])
        setRecentActivity([])
        setComparisonAgents([])
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadAnalytics()
    const intervalId = window.setInterval(loadAnalytics, 30000)

    return () => {
      controller.abort()
      window.clearInterval(intervalId)
    }
  }, [])

  const summaryCards = useMemo(() => {
    const openDisputes = dashboardDisputes.filter((dispute) => dispute.status === "Open").length
    const inProgress = dashboardDisputes.filter((dispute) => dispute.status === "In Progress").length
    const resolved = dashboardDisputes.filter((dispute) => dispute.status === "Resolved").length

    return [
      { icon: TrendingUp, label: "Open Disputes", value: String(openDisputes), sub: "Live queue", color: "text-blue-600" },
      { icon: Users, label: "Customers Helped", value: performanceMetrics.find((metric) => metric.label === "Cases Handled")?.value || String(dashboardDisputes.length), sub: "Database-backed", color: "text-emerald-600" },
      { icon: Clock, label: "Pending Queries", value: String(inProgress), sub: "Live queue", color: "text-amber-600" },
      { icon: Star, label: "Resolved Today", value: String(resolved), sub: "Live queue", color: "text-violet-600" },
    ]
  }, [dashboardDisputes, performanceMetrics])

  const handleExport = () => {
    const data = {
      exportDate: new Date().toISOString(),
      summaryCards,
      performanceMetrics,
      recentActivity,
      comparisonAgents,
      disputes: dashboardDisputes,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `agent-analytics-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Agent Analytics</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Real-time performance metrics from the database</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="bg-transparent gap-2 text-sm">
          <Download size={16} /> Export
        </Button>
      </div>

      {error ? (
        <Card className="p-4 border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm">
          Failed to load analytics from the database: {error}
        </Card>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((card, index) => (
          <Card key={index} className="p-4 border-0 shadow-sm">
            <card.icon className={`w-5 h-5 ${card.color} mb-2`} />
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</p>
            <p className="text-[10px] text-gray-400">{card.sub}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-4 lg:p-5 border-0 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Performance Metrics</h2>
          <div className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading performance metrics...</p>
            ) : performanceMetrics.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No performance metrics found.</p>
            ) : (
              performanceMetrics.map((metric) => (
                <div key={metric.label} className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{metric.label}</p>
                    <p className="text-[10px] text-gray-500">Benchmark: {metric.benchmark}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{metric.value}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-4 lg:p-5 border-0 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading activity...</p>
            ) : recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity found.</p>
            ) : (
              recentActivity.map((activity, index) => (
                <div key={`${activity.type}-${index}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${activity.type === "success" ? "bg-emerald-100 dark:bg-emerald-900/30" : activity.type === "warning" ? "bg-amber-100 dark:bg-amber-900/30" : "bg-blue-100 dark:bg-blue-900/30"}`}>
                    <TrendingUp className={`w-4 h-4 ${activity.type === "success" ? "text-emerald-600" : activity.type === "warning" ? "text-amber-600" : "text-blue-600"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.description}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-4 lg:p-5 border-0 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Live Disputes</h2>
          <div className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading live disputes...</p>
            ) : dashboardDisputes.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No disputes assigned to you.</p>
            ) : (
              dashboardDisputes.slice(0, 5).map((dispute) => (
                <div key={dispute.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{dispute.customer}</p>
                      <p className="text-[10px] text-gray-500">{dispute.provider} · {dispute.date || "N/A"}</p>
                    </div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">{dispute.amount}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{dispute.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">{dispute.status}</span>
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">{dispute.severity}</span>
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">{dispute.resolution}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-4 lg:p-5 border-0 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Agent Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Rank</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Agent</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Cases</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Rating</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      Loading comparison data...
                    </td>
                  </tr>
                ) : comparisonAgents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      No comparison data available.
                    </td>
                  </tr>
                ) : (
                  comparisonAgents.map((agent) => (
                    <tr key={`${agent.rank}-${agent.name}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-3 py-3 text-sm font-semibold text-gray-900 dark:text-white">#{agent.rank}</td>
                      <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-300">{agent.name}</td>
                      <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-300">{agent.cases}</td>
                      <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-300">{agent.rating.toFixed(1)}</td>
                      <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-300">KES {agent.earnings.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
