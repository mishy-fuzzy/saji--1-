"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, AlertCircle, CheckCircle } from "lucide-react"
import { AdminStats } from "./admin-stats"
import { ProviderManagement } from "./provider-management"
import { SystemSettings } from "./system-settings"

interface AdminDashboardProps {
  admin: {
    id: string
    fullName: string
    email: string
  }
}

type DashboardUser = {
  id: string
  name: string
  role: string
  status: string
  earnings: number
  joined: string
}

export function AdminDashboard({ admin }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [pendingVerifications, setPendingVerifications] = useState<Array<{ id: string; name: string; category: string; submittedAt: string }>>([])
  const [recentTransactions, setRecentTransactions] = useState<Array<{ id: string; customer: string; provider: string; amount: number; status: string; date: string }>>([])
  const [disputes, setDisputes] = useState<Array<{ id: string; customer: string; provider: string; amount: number; status: string; createdAt: string }>>([])

  useEffect(() => {
    const fetchAdminSummary = async () => {
      try {
        const response = await fetch("/api/admin/users", {
          cache: "no-store",
          headers: {
            "x-user-role": "admin",
          },
        })
        const payload = await response.json()

        if (!response.ok || !payload?.ok || !Array.isArray(payload?.data)) {
          return
        }

        const users = payload.data as DashboardUser[]

        const pending = users
          .filter((u) => String(u.role || "").toLowerCase() === "provider" && String(u.status || "") === "Pending")
          .slice(0, 5)
          .map((u) => ({
            id: u.id,
            name: u.name,
            category: "provider",
            submittedAt: u.joined,
          }))

        const transactions = users
          .filter((u) => Number(u.earnings || 0) > 0)
          .slice(0, 6)
          .map((u) => ({
            id: u.id,
            customer: "Platform",
            provider: u.name,
            amount: Number(u.earnings || 0),
            status: "completed",
            date: u.joined,
          }))

        const disputeRows = users
          .filter((u) => String(u.status || "") === "Disputed")
          .slice(0, 6)
          .map((u) => ({
            id: u.id,
            customer: u.name,
            provider: "Platform",
            amount: Number(u.earnings || 0),
            status: "open",
            createdAt: u.joined,
          }))

        setPendingVerifications(pending)
        setRecentTransactions(transactions)
        setDisputes(disputeRows)
      } catch {
        // Keep dashboard UI stable if summary fetch fails.
      }
    }

    fetchAdminSummary()
  }, [])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage SAJI platform, providers, and transactions</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <AdminStats />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Verifications */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  Pending Verifications
                </h3>
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                  {pendingVerifications.length}
                </Badge>
              </div>

              <div className="space-y-3">
                {pendingVerifications.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 border-2 border-border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.submittedAt}</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 capitalize">
                        {item.category}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 rounded-lg h-9 bg-green-600 hover:bg-green-700 text-white">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 rounded-lg border-2 h-9 bg-transparent text-destructive"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Transactions */}
            <Card className="p-6">
              <h3 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Recent Transactions
              </h3>

              <div className="space-y-3">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 border-2 border-border rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        {tx.customer} → {tx.provider}
                      </p>
                      <p className="text-xs text-muted-foreground">{tx.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">KES {tx.amount.toLocaleString()}</p>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs">
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Providers Tab */}
        <TabsContent value="providers">
          <ProviderManagement />
        </TabsContent>

        {/* Disputes Tab */}
        <TabsContent value="disputes" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-foreground text-lg">Active Disputes</h3>
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                {disputes.length}
              </Badge>
            </div>

            <div className="space-y-4">
              {disputes.map((dispute) => (
                <Card key={dispute.id} className="p-6 border-2 border-red-200 dark:border-red-900/50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">
                        {dispute.customer} vs {dispute.provider}
                      </h4>
                      <p className="text-sm text-muted-foreground">Opened: {dispute.createdAt}</p>
                    </div>
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 capitalize">
                      {dispute.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Amount</p>
                      <p className="text-xl font-bold text-foreground">KES {dispute.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Action</p>
                      <Button size="sm" className="rounded-lg text-white bg-primary h-9">
                        Review Case
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <SystemSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
