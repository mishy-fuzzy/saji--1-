"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertCircle, ArrowRight, Briefcase, CheckCircle, FileText, ShieldCheck, Users } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, CartesianGrid, Cell, PieChart, Pie, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

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

type SubAdminUser = {
  id: string
  name: string
  role: string
  status: string
  joined: string
}

type ReportItem = {
  id: string
  name: string
  type: string
  status: string
  createdBy: string
  date: string
}

export default function SubAdminDashboard() {
  const [platformGrowth, setPlatformGrowth] = useState<PlatformGrowthPayload | null>(null)
  const [users, setUsers] = useState<SubAdminUser[]>([])
  const [reports, setReports] = useState<ReportItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const loadDashboard = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [growthResponse, usersResponse, reportsResponse] = await Promise.all([
          fetch("/api/admin/analytics/platform-growth", {
            cache: "no-store",
            headers: {
              "x-user-role": "sub-admin",
            },
            signal: controller.signal,
          }),
          fetch("/api/sub-admin/users", {
            cache: "no-store",
            headers: {
              "x-user-role": "sub-admin",
            },
            signal: controller.signal,
          }),
          fetch("/api/reports?scope=subadmin", {
            cache: "no-store",
            headers: {
              "x-user-role": "sub-admin",
            },
            signal: controller.signal,
          }),
        ])

        const [growthPayload, usersPayload, reportsPayload] = await Promise.all([
          growthResponse.json(),
          usersResponse.json(),
          reportsResponse.json(),
        ])

        if (!growthResponse.ok || !growthPayload?.ok) {
          throw new Error(growthPayload?.error || "Failed to load platform growth data")
        }

        if (!usersResponse.ok || !usersPayload?.ok || !Array.isArray(usersPayload?.data)) {
          throw new Error(usersPayload?.error || "Failed to load users")
        }

        if (!reportsResponse.ok || !reportsPayload?.ok || !Array.isArray(reportsPayload?.data)) {
          throw new Error(reportsPayload?.error || "Failed to load reports")
        }

        setPlatformGrowth({
          monthlyData: Array.isArray(growthPayload?.data?.monthlyData) ? growthPayload.data.monthlyData : [],
          dailyActivity: Array.isArray(growthPayload?.data?.dailyActivity) ? growthPayload.data.dailyActivity : [],
          stats: {
            userGrowth: String(growthPayload?.data?.stats?.userGrowth || "0%"),
            jobGrowth: String(growthPayload?.data?.stats?.jobGrowth || "0%"),
            verificationRate: String(growthPayload?.data?.stats?.verificationRate || "0%"),
            engagement: String(growthPayload?.data?.stats?.engagement || "0min"),
          },
        })

        setUsers(
          usersPayload.data.map((row: Partial<SubAdminUser>) => ({
            id: String(row.id || ""),
            name: String(row.name || "Unnamed User"),
            role: String(row.role || "Unknown"),
            status: String(row.status || "Active"),
            joined: String(row.joined || ""),
          })),
        )

        setReports(
          reportsPayload.data.map((row: Partial<ReportItem>) => ({
            id: String(row.id || ""),
            name: String(row.name || "Generated Report"),
            type: String(row.type || "general"),
            status: String(row.status || "Ready"),
            createdBy: String(row.createdBy || "System"),
            date: String(row.date || ""),
          })),
        )
      } catch (err) {
        if (controller.signal.aborted) return
        const message = err instanceof Error ? err.message : "Failed to load dashboard"
        setError(message)
        setPlatformGrowth(null)
        setUsers([])
        setReports([])
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadDashboard()
    const intervalId = window.setInterval(loadDashboard, 30000)

    return () => {
      controller.abort()
      window.clearInterval(intervalId)
    }
  }, [])

  const stats = useMemo(() => {
    const roleCounts = users.reduce<Record<string, number>>((acc, user) => {
      const key = user.role || "Unknown"
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    return [
      {
        icon: Users,
        label: "Total Users",
        value: String(users.length),
        change: platformGrowth?.stats.userGrowth || "0%",
        positive: true,
        color: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
        iconColor: "text-blue-600",
      },
      {
        icon: Briefcase,
        label: "Active Jobs",
        value: platformGrowth?.monthlyData.at(-1)?.jobs?.toString() || "0",
        change: platformGrowth?.stats.jobGrowth || "0%",
        positive: true,
        color: "from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20",
        iconColor: "text-amber-600",
      },
      {
        icon: CheckCircle,
        label: "Verified Users",
        value: platformGrowth?.stats.verificationRate || "0%",
        change: platformGrowth?.stats.engagement || "0min",
        positive: true,
        color: "from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20",
        iconColor: "text-emerald-600",
      },
      {
        icon: AlertCircle,
        label: "Pending Approvals",
        value: String(users.filter((user) => user.status === "Pending").length),
        change: `${Object.keys(roleCounts).length} roles`,
        positive: false,
        color: "from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20",
        iconColor: "text-red-600",
      },
    ]
  }, [platformGrowth, users])

  const roleDistribution = useMemo(() => {
    const counts = users.reduce<Record<string, number>>((acc, user) => {
      const key = user.role || "Unknown"
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    const palette = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6"]
    return Object.entries(counts).map(([name, value], index) => ({
      name,
      value,
      color: palette[index % palette.length],
    }))
  }, [users])

  const recentUsers = useMemo(() => users.slice(0, 5), [users])
  const recentReports = useMemo(() => reports.slice(0, 5), [reports])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Sub-Admin Dashboard</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Live platform metrics from the database</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-sm">Database Snapshot</Button>
      </div>

      {error ? (
        <Card className="p-4 border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm">
          Failed to load dashboard from the database: {error}
        </Card>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className={`p-4 lg:p-5 border-0 shadow-sm bg-gradient-to-br ${stat.color}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-white/60 dark:bg-gray-700/50">
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <span className={`text-xs font-semibold ${stat.positive ? "text-emerald-600" : "text-red-600"}`}>
                {stat.change}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">{stat.label}</p>
            <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-4 lg:p-5 border-0 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Platform Growth</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={platformGrowth?.monthlyData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }} />
              <Bar dataKey="users" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Users" />
              <Bar dataKey="jobs" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Jobs" />
              <Bar dataKey="verifications" fill="#10b981" radius={[6, 6, 0, 0]} name="Verifications" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4 lg:p-5 border-0 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">User Role Distribution</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={roleDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value">
                {roleDistribution.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {roleDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600 dark:text-gray-300">{item.name}</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 lg:p-5 border-0 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Recent Users</h2>
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-2 py-0.5 rounded-full font-medium">
              {users.length}
            </span>
          </div>
          <div className="space-y-2">
            {isLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading users...</p>
            ) : recentUsers.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No users found.</p>
            ) : (
              recentUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-xs font-bold">
                    {user.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-gray-500">{user.role} · {user.joined}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    {user.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-4 lg:p-5 border-0 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Latest Reports</h2>
            <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
              {reports.length}
            </span>
          </div>
          <div className="space-y-2">
            {isLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading reports...</p>
            ) : recentReports.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No reports available.</p>
            ) : (
              recentReports.map((report) => (
                <div key={report.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{report.name}</p>
                    <p className="text-[10px] text-gray-500">{report.type} · {report.date}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    {report.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="p-4 lg:p-5 border-0 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Daily Activity</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={platformGrowth?.dailyActivity || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }} />
            <Bar dataKey="logins" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Logins" />
            <Bar dataKey="actions" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Actions" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
