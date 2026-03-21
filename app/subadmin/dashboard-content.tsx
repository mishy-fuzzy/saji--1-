"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, TrendingUp, AlertCircle, CheckCircle, Download, Eye } from "lucide-react"

export default function SubadminDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("week")

  const stats = [
    { icon: Users, label: "Total Agents", value: "142", color: "bg-blue-100 dark:bg-blue-900", trend: "+8" },
    { icon: TrendingUp, label: "Active Cases", value: "2,847", color: "bg-green-100 dark:bg-green-900", trend: "+124" },
    { icon: AlertCircle, label: "Pending Issues", value: "34", color: "bg-yellow-100 dark:bg-yellow-900", trend: "-5" },
    { icon: CheckCircle, label: "Resolution Rate", value: "94%", color: "bg-purple-100 dark:bg-purple-900", trend: "+2%" },
  ]

  const agents = [
    { id: 1, name: "Daniel K.", email: "daniel@example.com", active: 47, rating: 4.8, status: "Active", joined: "Jan 2025" },
    { id: 2, name: "Grace M.", email: "grace@example.com", active: 32, rating: 4.6, status: "Active", joined: "Dec 2024" },
    { id: 3, name: "Robert J.", email: "robert@example.com", active: 53, rating: 4.9, status: "Active", joined: "Nov 2024" },
  ]

  const teamMetrics = [
    { metric: "Avg Cases/Agent", value: "20.1", target: "18", status: "above" },
    { metric: "Avg Rating", value: "4.7/5", target: "4.5/5", status: "above" },
    { metric: "Satisfaction Rate", value: "92%", target: "90%", status: "above" },
  ]

  const handleExportReport = () => {
    const data = {
      exportDate: new Date().toISOString(),
      stats: {
        totalAgents: 142,
        activeCases: 2847,
        pendingIssues: 34,
        resolutionRate: "94%"
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
                  {agents.map(agent => (
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
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1">
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
    </div>
  )
}
