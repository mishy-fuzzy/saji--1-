"use client"

import { useEffect, useState } from "react"
import { Download, TrendingUp, Users, Briefcase, ShieldCheck } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AreaChart, Area, BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type PlatformGrowthPayload = {
  monthlyData: Array<{ month: string; users: number; jobs: number; verifications: number }>
  dailyActivity: Array<{ day: string; logins: number; actions: number }>
  stats: {
    userGrowth: string
    jobGrowth: string
    verificationRate: string
    engagement: string
  }
}

export default function SubAdminAnalyticsPage() {
  const [data, setData] = useState<PlatformGrowthPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const loadAnalytics = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/admin/analytics/platform-growth", {
          cache: "no-store",
          headers: {
            "x-user-role": "sub-admin",
          },
          signal: controller.signal,
        })
        const payload = await response.json()

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || "Failed to load analytics")
        }

        setData({
          monthlyData: Array.isArray(payload?.data?.monthlyData) ? payload.data.monthlyData : [],
          dailyActivity: Array.isArray(payload?.data?.dailyActivity) ? payload.data.dailyActivity : [],
          stats: {
            userGrowth: String(payload?.data?.stats?.userGrowth || "0%"),
            jobGrowth: String(payload?.data?.stats?.jobGrowth || "0%"),
            verificationRate: String(payload?.data?.stats?.verificationRate || "0%"),
            engagement: String(payload?.data?.stats?.engagement || "0min"),
          },
        })
      } catch (err) {
        if (controller.signal.aborted) return
        const message = err instanceof Error ? err.message : "Failed to load analytics"
        setError(message)
        setData(null)
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

  const handleExport = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      ...data,
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sub-admin-analytics-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const cards = [
    { icon: Users, label: "User Growth", value: data?.stats.userGrowth || "0%", sub: "vs last month", color: "text-blue-600" },
    { icon: Briefcase, label: "Job Growth", value: data?.stats.jobGrowth || "0%", sub: "vs last month", color: "text-amber-600" },
    { icon: ShieldCheck, label: "Verification Rate", value: data?.stats.verificationRate || "0%", sub: "of submissions", color: "text-emerald-600" },
    { icon: TrendingUp, label: "Engagement", value: data?.stats.engagement || "0min", sub: "avg session", color: "text-violet-600" },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Platform growth and engagement metrics from the database</p>
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
        {cards.map((card, index) => (
          <Card key={index} className="p-4 border-0 shadow-sm">
            <card.icon className={`w-5 h-5 ${card.color} mb-2`} />
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</p>
            <p className="text-[10px] text-gray-400">{card.sub}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4 lg:p-5 border-0 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Platform Growth (6 months)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data?.monthlyData || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }} />
            <Area type="monotone" dataKey="users" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} name="Total Users" />
            <Area type="monotone" dataKey="jobs" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} name="Active Jobs" />
            <Area type="monotone" dataKey="verifications" stroke="#10b981" fill="#10b981" fillOpacity={0.1} name="Verifications" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-4 lg:p-5 border-0 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Weekly User Activity</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data?.dailyActivity || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }} />
            <Bar dataKey="logins" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Logins" />
            <Bar dataKey="actions" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Actions" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Refreshing analytics from the database...</p>
      ) : null}
    </div>
  )
}
