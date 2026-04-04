"use client"

import { useEffect, useMemo, useState } from "react"
import { useLocalization } from "@/lib/hooks/useLocalization"
import { useAuthContext } from "@/lib/auth-context"
import {
  AlertTriangle,
  Users,
  MessageSquare,
  CheckCircle,
  TrendingUp,
  Download,
  Filter,
  Eye,
  X,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Dispute = {
  id: string
  provider: string
  customer: string
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

function normalizeDisputeStatus(status: string): Dispute["status"] {
  const value = String(status || "open").toLowerCase()
  if (value === "resolved") return "Resolved"
  if (value === "in progress" || value === "under_review") return "In Progress"
  return "Open"
}

export default function AgentDashboard() {
  const { currency } = useLocalization()
  const { user } = useAuthContext()
  const [agentUsersCount, setAgentUsersCount] = useState(0)
  const [customerUsersCount, setCustomerUsersCount] = useState(0)
  const [selectedPeriod, setSelectedPeriod] = useState("week")
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [showOpenOnly, setShowOpenOnly] = useState(false)
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])

  const stats = useMemo(() => {
    const openDisputes = disputes.filter((d) => d.status === "Open").length
    const inProgress = disputes.filter((d) => d.status === "In Progress").length
    const resolved = disputes.filter((d) => d.status === "Resolved").length

    return [
      {
        icon: AlertTriangle,
        label: "Open Disputes",
        value: String(openDisputes),
        color: "bg-red-400/15",
        trend: "Live queue",
      },
      {
        icon: Users,
        label: "Customers Helped",
        value: String(customerUsersCount),
        color: "bg-sky-400/15",
        trend: `${agentUsersCount} users in scope`,
      },
      {
        icon: MessageSquare,
        label: "Pending Queries",
        value: String(inProgress),
        color: "bg-amber-400/15",
        trend: "Live inbox",
      },
      {
        icon: CheckCircle,
        label: "Resolved Today",
        value: String(resolved),
        color: "bg-emerald-400/15",
        trend: "Live",
      },
    ]
  }, [agentUsersCount, customerUsersCount, disputes])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/agent/users", {
          cache: "no-store",
          headers: { "x-user-role": "agent" },
        })
        const payload = await response.json()
        if (!response.ok || !payload?.ok || !Array.isArray(payload?.data)) return

        const users = payload.data as Array<{ role?: string }>
        setAgentUsersCount(users.length)
        setCustomerUsersCount(
          users.filter((u) => String(u.role || "").toLowerCase() === "customer").length,
        )
      } catch {
        // Keep dashboard usable even if users API is temporarily unavailable.
      }
    }

    fetchUsers()
  }, [])

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await fetch("/api/agent/dashboard", {
          cache: "no-store",
          headers: { "x-user-role": "agent" },
        })
        const payload = await response.json()
        if (!response.ok || !payload?.ok) return

        const incomingDisputes = Array.isArray(payload?.disputes) ? payload.disputes : []
        const incomingPerformance = Array.isArray(payload?.performanceMetrics)
          ? payload.performanceMetrics
          : []
        const incomingActivity = Array.isArray(payload?.recentActivity) ? payload.recentActivity : []

        setDisputes(
          incomingDisputes.map((row: any) => ({
            id: String(row.id || ""),
            provider: String(row.provider || "Unassigned"),
            customer: String(row.customer || "Unknown"),
            status: normalizeDisputeStatus(String(row.status || "Open")),
            severity:
              String(row.severity || "Low") === "High"
                ? "High"
                : String(row.severity || "Low") === "Medium"
                  ? "Medium"
                  : "Low",
            amount: String(row.amount || `${currency} 0`),
            date: String(row.date || ""),
            description: String(row.description || "Dispute requires review"),
            resolution: String(row.resolution || "Pending"),
          })),
        )

        setPerformanceMetrics(
          incomingPerformance.map((row: any) => ({
            label: String(row.label || "Metric"),
            value: String(row.value || "0"),
            benchmark: String(row.benchmark || "N/A"),
          })),
        )

        setRecentActivity(
          incomingActivity.map((row: any) => ({
            type: String(row.type || "update"),
            description: String(row.description || "Activity recorded"),
            time: String(row.time || "Now"),
          })),
        )

        if (payload?.stats?.customersHelped !== undefined) {
          setCustomerUsersCount(Number(payload.stats.customersHelped || 0))
        }
      } catch {
        // Keep existing UI data if API is temporarily unavailable.
      }
    }

    loadDashboard()
    const intervalId = window.setInterval(loadDashboard, 25000)
    return () => window.clearInterval(intervalId)
  }, [currency])

  const handleViewDispute = (dispute: Dispute) => {
    setSelectedDispute(dispute)
    setShowDisputeModal(true)
  }

  const handleExportReport = () => {
    const data = {
      exportDate: new Date().toISOString(),
      agentId: user?.id || user?.email || "agent",
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
              resolution:
                item.status === "Open"
                  ? "Escalated and under review"
                  : "Resolved Successfully",
            }
          : item,
      ),
    )

    setSelectedDispute((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        status: prev.status === "Open" ? "In Progress" : "Resolved",
        resolution:
          prev.status === "Open"
            ? "Escalated and under review"
            : "Resolved Successfully",
      }
    })
  }

  const visibleDisputes = showOpenOnly ? disputes.filter((d) => d.status === "Open") : disputes

  return (
    <div className="space-y-8 pb-8">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 p-6 text-white shadow-2xl shadow-black/20 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300">
              Dispute Desk
            </div>
            <h1 className="text-3xl font-bold tracking-tight lg:text-5xl">Agent Dashboard</h1>
            <p className="max-w-xl text-sm text-slate-300 lg:text-base">
              Resolve disputes, answer customer queries, and track live case performance from the database.
            </p>
          </div>
          <Button onClick={handleExportReport} className="gap-2 bg-amber-400 text-slate-950 hover:bg-amber-300">
            <Download size={18} />
            Export Report
          </Button>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {["day", "week", "month"].map((period) => (
          <Button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            variant={selectedPeriod === period ? "default" : "outline"}
            className={
              selectedPeriod === period
                ? "bg-amber-400 text-slate-950 hover:bg-amber-300"
                : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            }
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card key={idx} className="border-white/10 bg-white/5 p-6 shadow-none backdrop-blur-sm transition-shadow hover:bg-white/10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="mb-2 text-sm text-slate-400">{stat.label}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <p className="mt-2 text-xs text-amber-300">{stat.trend} from last period</p>
                </div>
                <div className={`${stat.color} rounded-xl p-3`}>
                  <Icon className="h-6 w-6 text-slate-800" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <Tabs defaultValue="disputes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 border border-white/10 bg-white/5">
          <TabsTrigger value="disputes">Active Disputes</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="disputes" className="space-y-4">
          <Card className="border-white/10 bg-slate-950/60 p-6 shadow-none backdrop-blur-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Active Disputes</h2>
              <Button
                variant="outline"
                className="gap-2 border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                onClick={() => setShowOpenOnly((prev) => !prev)}
              >
                <Filter size={18} />
                {showOpenOnly ? "All" : "Open"}
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Provider</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Customer</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Severity</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {visibleDisputes.map((dispute) => (
                    <tr key={dispute.id} className="transition-colors hover:bg-white/5">
                      <td className="px-6 py-4 text-sm font-medium text-white">{dispute.id}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{dispute.provider}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{dispute.customer}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            dispute.status === "Open"
                              ? "bg-red-400/15 text-red-300"
                              : dispute.status === "In Progress"
                                ? "bg-amber-400/15 text-amber-300"
                                : "bg-emerald-400/15 text-emerald-300"
                          }`}
                        >
                          {dispute.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`rounded px-2 py-1 text-xs font-medium ${
                            dispute.severity === "High"
                              ? "text-red-300"
                              : dispute.severity === "Medium"
                                ? "text-amber-300"
                                : "text-sky-300"
                          }`}
                        >
                          {dispute.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-white">{dispute.amount}</td>
                      <td className="px-6 py-4 text-sm">
                        <Button size="sm" className="gap-1 bg-amber-400 text-slate-950 hover:bg-amber-300" onClick={() => handleViewDispute(dispute)}>
                          <Eye size={16} />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {visibleDisputes.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-400">
                        No disputes available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {performanceMetrics.map((metric, idx) => (
              <Card key={idx} className="border-white/10 bg-slate-950/60 p-6 shadow-none backdrop-blur-sm">
                <h3 className="mb-4 text-lg font-semibold text-white">{metric.label}</h3>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-amber-300">{metric.value}</p>
                    <p className="mt-2 text-sm text-slate-400">Benchmark: {metric.benchmark}</p>
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/10">
                    <TrendingUp className="h-8 w-8 text-amber-300" />
                  </div>
                </div>
              </Card>
            ))}
            {performanceMetrics.length === 0 && (
              <Card className="border-white/10 bg-slate-950/60 p-6 shadow-none backdrop-blur-sm md:col-span-2">
                <p className="text-sm text-slate-400">No performance metrics available.</p>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card className="border-white/10 bg-slate-950/60 p-6 shadow-none backdrop-blur-sm">
            <h2 className="mb-6 text-2xl font-bold text-white">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-4 border-b border-white/10 pb-4 last:border-0">
                  <div
                    className={`mt-2 h-3 w-3 rounded-full ${
                      activity.type === "dispute_resolved"
                        ? "bg-emerald-400"
                        : activity.type === "query_answered"
                          ? "bg-sky-400"
                          : activity.type === "escalation"
                            ? "bg-red-400"
                            : "bg-amber-400"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-white">{activity.description}</p>
                    <p className="mt-1 text-sm text-slate-400">{activity.time}</p>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && <p className="text-sm text-slate-400">No recent activity available.</p>}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {showDisputeModal && selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-md border-white/10 bg-slate-950 text-white">
            <div className="space-y-4 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Dispute Details</h2>
                <button onClick={() => setShowDisputeModal(false)} className="rounded p-1 hover:bg-white/5">
                  <X size={20} className="text-slate-300" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-400">Dispute ID</p>
                  <p className="text-lg font-semibold text-white">{selectedDispute.id}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Provider</p>
                  <p className="text-lg font-semibold text-white">{selectedDispute.provider}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Customer</p>
                  <p className="text-lg font-semibold text-white">{selectedDispute.customer}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Description</p>
                  <p className="text-lg font-semibold text-white">{selectedDispute.description}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Amount</p>
                  <p className="text-lg font-semibold text-white">{selectedDispute.amount}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  <p className="text-lg font-semibold text-white">{selectedDispute.status}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Resolution</p>
                  <p className="text-lg font-semibold text-white">{selectedDispute.resolution}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                  onClick={() => setShowDisputeModal(false)}
                >
                  Close
                </Button>
                <Button className="flex-1 bg-amber-400 text-slate-950 hover:bg-amber-300" onClick={handleUpdateDisputeStatus}>
                  Update Status
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
