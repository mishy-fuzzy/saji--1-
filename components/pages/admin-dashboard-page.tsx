"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuthContext } from "@/lib/auth-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Users, Briefcase, TrendingUp, AlertCircle, Download, BarChart3, ArrowUpRight } from "lucide-react"

type AdminUserRow = {
  id: string
  name: string
  role: string
  status: string
  earnings: number
  orders: number
}

type ReportRow = {
  id: string
  name: string
  type: string
  createdBy: string
  date: string
  data?: unknown
}

export function AdminDashboardPage() {
  const { user, logout } = useAuthContext()
  const [isExporting, setIsExporting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [usersData, setUsersData] = useState<AdminUserRow[]>([])
  const [reportsData, setReportsData] = useState<ReportRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [usersRes, reportsRes] = await Promise.all([
          fetch("/api/admin/users", {
            cache: "no-store",
            headers: { "x-user-role": "admin" },
          }),
          fetch("/api/reports?scope=admin", {
            cache: "no-store",
            headers: { "x-user-role": "admin" },
          }),
        ])

        const usersPayload = await usersRes.json()
        const reportsPayload = await reportsRes.json()

        if (usersRes.ok && usersPayload?.ok && Array.isArray(usersPayload?.data)) {
          setUsersData(usersPayload.data)
        }

        if (reportsRes.ok && reportsPayload?.ok && Array.isArray(reportsPayload?.data)) {
          setReportsData(reportsPayload.data)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load dashboard data"
        setError(message)
      }
    }

    fetchDashboardData()
  }, [])

  const recentProviders = useMemo(() => {
    return usersData
      .filter((u) => String(u.role || "").toLowerCase() === "provider")
      .slice(0, 3)
      .map((u) => ({
        id: u.id,
        name: u.name,
        services: Number(u.orders || 0),
        rating: 4.7,
        status: String(u.status || "").toLowerCase() === "pending" ? "pending" : "verified",
      }))
  }, [usersData])

  const stats = useMemo(() => {
    const totalUsers = usersData.length
    const activeJobs = usersData.reduce((sum, u) => sum + Number(u.orders || 0), 0)
    const revenue = usersData.reduce((sum, u) => sum + Number(u.earnings || 0), 0)
    const disputes = usersData.filter((u) => String(u.status || "") === "Disputed").length

    return [
      { label: "Total Users", value: totalUsers, icon: Users, color: "bg-purple-500", trend: "live" },
      { label: "Active Jobs", value: activeJobs, icon: Briefcase, color: "bg-blue-500", trend: "live" },
      { label: "Platform Revenue", value: `KES ${revenue.toLocaleString()}`, icon: TrendingUp, color: "bg-green-500", trend: "live" },
      { label: "Disputes", value: disputes, icon: AlertCircle, color: "bg-red-500", trend: "live" },
    ]
  }, [usersData])

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const data = {
        exportDate: new Date().toISOString(),
        stats: stats.map(s => ({ label: s.label, value: s.value })),
        providers: recentProviders,
        reports: reportsData,
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Export failed"
      setError(message)
    } finally {
      setIsExporting(false)
    }
  }

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "admin",
        },
        body: JSON.stringify({
          scope: "admin",
          type: "performance",
        }),
      })
      const payload = await response.json()

      if (!response.ok || !payload?.ok || !payload?.data) {
        throw new Error(payload?.error || "Report generation failed")
      }

      setReportsData((prev) => [payload.data, ...prev])
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Report generation failed"
      setError(message)
    } finally {
      setIsGenerating(false)
    }
  }

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

      {error ? (
        <Card className="p-3 border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm">
          {error}
        </Card>
      ) : null}

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
