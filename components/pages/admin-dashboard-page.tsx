"use client"

import { useState } from "react"
import { useAuthContext } from "@/lib/auth-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Users, Briefcase, TrendingUp, AlertCircle, Download, BarChart3, ArrowUpRight } from "lucide-react"

export function AdminDashboardPage() {
  const { user, logout } = useAuthContext()
  const [isExporting, setIsExporting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const stats = [
    { label: "Total Users", value: 1245, icon: Users, color: "bg-purple-500", trend: "+12%" },
    { label: "Active Jobs", value: 342, icon: Briefcase, color: "bg-blue-500", trend: "+8%" },
    { label: "Platform Revenue", value: "KES45,230", icon: TrendingUp, color: "bg-green-500", trend: "+24%" },
    { label: "Disputes", value: 3, icon: AlertCircle, color: "bg-red-500", trend: "-2%" },
  ]

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 1500))
      const data = {
        exportDate: new Date().toISOString(),
        stats: stats.map(s => ({ label: s.label, value: s.value })),
        providers: recentProviders,
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("[v0] Export error:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      const reportData = {
        title: "Monthly Performance Report",
        generatedAt: new Date().toLocaleString(),
        summary: {
          totalUsers: 1245,
          activeJobs: 342,
          completedJobs: 218,
          revenue: "$45,230",
          disputes: 3,
        },
        topPerformers: recentProviders.slice(0, 3),
        metrics: {
          userGrowth: "+12%",
          jobCompletion: "89%",
          customerSatisfaction: "4.7/5",
          platformHealth: "Excellent",
        }
      }
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("[v0] Report generation error:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const recentProviders = [
    { id: 1, name: "Daniel K.", services: 5, rating: 4.8, status: "verified" },
    { id: 2, name: "Grace M.", services: 3, rating: 4.6, status: "pending" },
    { id: 3, name: "Robert J.", services: 7, rating: 4.9, status: "verified" },
  ]

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage the SAJI marketplace</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
            className="bg-transparent gap-2"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "Exporting..." : "Export"}
          </Button>
          <Button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            {isGenerating ? "Generating..." : "Generate Report"}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              logout()
              window.location.href = "/"
            }}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <div className="flex items-end gap-2">
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <div className="flex items-center gap-0.5 text-emerald-600 text-sm font-semibold mb-0.5">
                      <ArrowUpRight className="w-4 h-4" />
                      {stat.trend}
                    </div>
                  </div>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="providers" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4 mt-6">
          <div className="space-y-4">
            {recentProviders.map((provider) => (
              <Card key={provider.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">{provider.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Services: {provider.services} | Rating: {provider.rating}⭐
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        provider.status === "verified" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {provider.status === "verified" ? "Verified" : "Pending"}
                    </span>
                    <Button size="sm" variant="outline">
                      Manage
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4 mt-6">
          <Card className="p-6 text-center text-muted-foreground">
            <p>User management coming soon</p>
          </Card>
        </TabsContent>

        <TabsContent value="disputes" className="space-y-4 mt-6">
          <Card className="p-6 text-center text-muted-foreground">
            <p>No active disputes</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
