"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, TrendingUp, AlertCircle, CheckCircle, Download, Eye, X } from "lucide-react"

type AgentRow = {
  id: string
  name: string
  email: string
  phone: string
  active: number
  rating: number
  status: string
  joined: string
  commission: string
}

export default function SubadminDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("week")
  const [selectedAgent, setSelectedAgent] = useState<AgentRow | null>(null)
  const [showAgentModal, setShowAgentModal] = useState(false)
  const [agents, setAgents] = useState<AgentRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch("/api/sub-admin/users", {
          cache: "no-store",
          headers: {
            "x-user-role": "sub-admin",
          },
        })
        const payload = await response.json()

        if (!response.ok || !payload?.ok || !Array.isArray(payload?.data)) {
          throw new Error(payload?.error || "Failed to load sub-admin users")
        }

        const mapped = payload.data
          .filter((u: any) => String(u.role || "").toLowerCase() === "agent")
          .map((u: any) => ({
            id: String(u.id),
            name: String(u.name || "Unnamed Agent"),
            email: String(u.email || "-"),
            phone: String(u.phone || "-"),
            active: Number(u.orders || 0),
            rating: 4.5,
            status: String(u.status || "Active"),
            joined: String(u.joined || "-"),
            commission: "10%",
          })) as AgentRow[]

        setAgents(mapped)
        setError(null)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load agents"
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAgents()
  }, [])

  const stats = useMemo(() => {
    const totalAgents = agents.length
    const activeCases = agents.reduce((sum, a) => sum + a.active, 0)
    const pendingIssues = agents.filter((a) => String(a.status).toLowerCase() === "pending").length
    const avgRating = totalAgents > 0 ? agents.reduce((sum, a) => sum + a.rating, 0) / totalAgents : 0
    const resolutionRate = Math.min(99, Math.max(80, Math.round((avgRating / 5) * 100)))

    return [
      { icon: Users, label: "Total Agents", value: String(totalAgents), color: "bg-blue-100 dark:bg-blue-900", trend: "Live" },
      { icon: TrendingUp, label: "Active Cases", value: activeCases.toLocaleString(), color: "bg-green-100 dark:bg-green-900", trend: "Live" },
      { icon: AlertCircle, label: "Pending Issues", value: String(pendingIssues), color: "bg-yellow-100 dark:bg-yellow-900", trend: "Live" },
      { icon: CheckCircle, label: "Resolution Rate", value: `${resolutionRate}%`, color: "bg-purple-100 dark:bg-purple-900", trend: "Live" },
    ]
  }, [agents])

  const teamMetrics = useMemo(() => {
    const totalAgents = Math.max(1, agents.length)
    const totalCases = agents.reduce((sum, a) => sum + a.active, 0)
    const avgCases = (totalCases / totalAgents).toFixed(1)
    const avgRating = (agents.reduce((sum, a) => sum + a.rating, 0) / totalAgents).toFixed(1)
    const activeAgents = agents.filter((a) => a.active > 0).length
    const satisfaction = Math.round((activeAgents / totalAgents) * 100)

    return [
      { metric: "Avg Cases/Agent", value: avgCases, target: "18", status: Number(avgCases) >= 18 ? "above" : "below" },
      { metric: "Avg Rating", value: `${avgRating}/5`, target: "4.5/5", status: Number(avgRating) >= 4.5 ? "above" : "below" },
      { metric: "Satisfaction Rate", value: `${satisfaction}%`, target: "90%", status: satisfaction >= 90 ? "above" : "below" },
    ]
  }, [agents])

  const handleViewAgent = (agent: AgentRow) => {
    setSelectedAgent(agent)
    setShowAgentModal(true)
  }

  const handleExportReport = () => {
    const data = {
      exportDate: new Date().toISOString(),
      stats: {
        totalAgents: Number(stats[0].value),
        activeCases: Number(String(stats[1].value).replace(/,/g, "")),
        pendingIssues: Number(stats[2].value),
        resolutionRate: stats[3].value,
      },
      agents: agents,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `subadmin-report-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Sub-admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage agents, team performance, and operational metrics</p>
        </div>
        <Button onClick={handleExportReport} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Download size={18} />
          Export Report
        </Button>
      </div>

      {error ? (
        <Card className="p-3 border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm">
          {error}
        </Card>
      ) : null}

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
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
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

      {/* Tabs */}
      <Tabs defaultValue="agents" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="agents">Active Agents</TabsTrigger>
          <TabsTrigger value="metrics">Team Metrics</TabsTrigger>
        </TabsList>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Agents Overview</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Agent</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Active Cases</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Rating</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                        Loading agents...
                      </td>
                    </tr>
                  ) : agents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                        No agents found
                      </td>
                    </tr>
                  ) : agents.map(agent => (
                    <tr key={agent.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{agent.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{agent.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{agent.active}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                        <span>★</span> {agent.rating}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          {agent.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Button
                          onClick={() => handleViewAgent(agent)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 gap-1"
                        >
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

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {teamMetrics.map((item, idx) => (
              <Card key={idx} className="p-6">
                <p className="text-sm text-muted-foreground mb-3">{item.metric}</p>
                <div className="flex items-baseline gap-2 mb-4">
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{item.value}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">vs {item.target}</p>
                </div>
                <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-300 rounded-full"></div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Agent Details Modal */}
      {showAgentModal && selectedAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Agent Details</h2>
                <button
                  onClick={() => setShowAgentModal(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedAgent.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedAgent.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedAgent.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Commission Rate</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedAgent.commission}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Cases</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedAgent.active}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Rating</p>
                  <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">★ {selectedAgent.rating}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Joined</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedAgent.joined}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setShowAgentModal(false)}
                >
                  Close
                </Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700">Edit Agent</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
