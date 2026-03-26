"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuthContext } from "@/lib/auth-context"
import { useLocalization } from "@/lib/hooks/useLocalization"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, TrendingUp, Clock, DollarSign, CheckCircle } from "lucide-react"
import Link from "next/link"
import { fetchProviderDashboard } from "@/lib/services/provider-dashboard-service"
import type { ProviderDashboardResponse } from "@/lib/contracts/provider-dashboard"

export function ProviderDashboardPage() {
  const { user, logout } = useAuthContext()
  const { currency } = useLocalization()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [data, setData] = useState<ProviderDashboardResponse>({
    ok: true,
    stats: {
      activeJobs: 0,
      completedJobs: 0,
      totalEarnings: 0,
      rating: "0.0★",
    },
    jobs: [],
  })

  useEffect(() => {
    let mounted = true

    const loadDashboard = async () => {
      try {
        setIsLoading(true)
        const payload = await fetchProviderDashboard()
        if (!mounted) return
        setData(payload)
        setError("")
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : "Failed to load provider dashboard")
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    loadDashboard()
    return () => {
      mounted = false
    }
  }, [])

  const stats = useMemo(
    () => [
      { label: "Active Jobs", value: data.stats.activeJobs, icon: Clock, color: "bg-blue-500" },
      { label: "Completed", value: data.stats.completedJobs, icon: CheckCircle, color: "bg-green-500" },
      { label: "Total Earnings", value: `${currency} ${data.stats.totalEarnings.toLocaleString()}`, icon: DollarSign, color: "bg-emerald-500" },
      { label: "Rating", value: data.stats.rating, icon: TrendingUp, color: "bg-yellow-500" },
    ],
    [data.stats, currency],
  )

  const inProgressJobs = data.jobs.filter((j) => j.status === "in-progress")
  const completedJobs = data.jobs.filter((j) => j.status === "completed")
  const pendingJobs = data.jobs.filter((j) => j.status === "pending")

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Welcome, {user?.name}!</h1>
          <p className="text-muted-foreground mt-2">Manage your services and jobs</p>
        </div>
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

      {error && (
        <Card className="p-4 border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 text-red-700 dark:text-red-300">
          {error}
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card key={idx} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{isLoading ? "..." : stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Jobs Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active Jobs</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-6">
          {inProgressJobs.length === 0 && !isLoading && (
            <Card className="p-6 text-sm text-muted-foreground">No active jobs right now.</Card>
          )}
          {inProgressJobs.map((job) => (
              <Card key={job.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">{job.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">Customer: {job.customer}</p>
                    <p className="text-sm text-muted-foreground">{job.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">
                      {currency} {job.amount}
                    </p>
                    <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                      In Progress
                    </span>
                  </div>
                </div>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {completedJobs.length === 0 && !isLoading && (
            <Card className="p-6 text-sm text-muted-foreground">No completed jobs yet.</Card>
          )}
          {completedJobs.map((job) => (
              <Card key={job.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">{job.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">Customer: {job.customer}</p>
                    <p className="text-sm text-muted-foreground">{job.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">
                      {currency} {job.amount}
                    </p>
                    <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      Completed
                    </span>
                  </div>
                </div>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {pendingJobs.length === 0 && !isLoading && (
            <Card className="p-6 text-sm text-muted-foreground">No pending jobs at the moment.</Card>
          )}
          {pendingJobs.map((job) => (
              <Card key={job.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">{job.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">Customer: {job.customer}</p>
                    <p className="text-sm text-muted-foreground">{job.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">
                      {currency} {job.amount}
                    </p>
                    <span className="inline-block mt-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                      Pending
                    </span>
                  </div>
                </div>
              </Card>
            ))}
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/provider/profile">
          <Button variant="outline" className="w-full h-12 bg-transparent">
            Edit Profile
          </Button>
        </Link>
        <Link href="/provider/services">
          <Button variant="outline" className="w-full h-12 bg-transparent">
            Manage Services
          </Button>
        </Link>
      </div>
    </div>
  )
}
