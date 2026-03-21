"use client"

import { useAuthContext } from "@/lib/auth-context"
import { useLocalization } from "@/lib/hooks/useLocalization"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, TrendingUp, Clock, DollarSign, CheckCircle } from "lucide-react"
import Link from "next/link"

export function ProviderDashboardPage() {
  const { user, logout } = useAuthContext()
  const { currency } = useLocalization()

  const mockJobs = [
    {
      id: 1,
      title: "House Cleaning",
      customer: "Sarah M.",
      status: "in-progress",
      amount: 150,
      date: "Today, 10:00 AM",
    },
    {
      id: 2,
      title: "Plumbing Repair",
      customer: "John D.",
      status: "pending",
      amount: 200,
      date: "Tomorrow, 2:00 PM",
    },
    {
      id: 3,
      title: "Electrical Installation",
      customer: "Emma L.",
      status: "completed",
      amount: 350,
      date: "Yesterday",
    },
  ]

  const stats = [
    { label: "Active Jobs", value: 2, icon: Clock, color: "bg-blue-500" },
    { label: "Completed", value: 42, icon: CheckCircle, color: "bg-green-500" },
    { label: "Total Earnings", value: `${currency} 12,450`, icon: DollarSign, color: "bg-emerald-500" },
    { label: "Rating", value: "4.9★", icon: TrendingUp, color: "bg-yellow-500" },
  ]

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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card key={idx} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
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
          {mockJobs
            .filter((j) => j.status === "in-progress")
            .map((job) => (
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
          {mockJobs
            .filter((j) => j.status === "completed")
            .map((job) => (
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
          {mockJobs
            .filter((j) => j.status === "pending")
            .map((job) => (
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
