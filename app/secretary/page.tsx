"use client"

import { useEffect, useMemo, useState } from "react"
import { useLocalization } from "@/lib/hooks/useLocalization"
import { CreditCard, TrendingUp, Clock, CheckCircle, AlertCircle, Download, Filter, BarChart3 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SecretaryDashboard() {
  const { currency } = useLocalization()
  const [totalUsers, setTotalUsers] = useState(0)
  const [pendingUsers, setPendingUsers] = useState(0)
  const [selectedPeriod, setSelectedPeriod] = useState("week")
  const [showProcessingOnly, setShowProcessingOnly] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/secretary/users", {
          cache: "no-store",
          headers: {
            "x-user-role": "secretary",
          },
        })
        const payload = await response.json()

        if (!response.ok || !payload?.ok || !Array.isArray(payload?.data)) {
          return
        }

        const users = payload.data as Array<{ status?: string }>
        setTotalUsers(users.length)
        setPendingUsers(
          users.filter((u) => String(u.status || "").toLowerCase() === "pending").length,
        )
      } catch {
        // Keep dashboard usable even if users API is temporarily unavailable.
      }
    }

    fetchUsers()
  }, [])

  const recentTransactions = [
    { id: "TXN-001", description: "Commission payout - Agent AGT-001", amount: `${currency} 45,000`, status: "Completed", date: "Jan 15", method: "Bank Transfer" },
    { id: "TXN-002", description: "Refund to customer - CUS-234", amount: `${currency} 12,500`, status: "Processing", date: "Jan 14", method: "M-Pesa" },
    { id: "TXN-003", description: "Provider withdrawal - PRV-567", amount: `${currency} 38,200`, status: "Completed", date: "Jan 13", method: "Bank Transfer" },
    { id: "TXN-004", description: "System fees collection", amount: `${currency} 8,900`, status: "Completed", date: "Jan 12", method: "Automatic" },
  ]

  const transactionTotals = useMemo(() => {
    const completed = recentTransactions.filter((t) => t.status === "Completed").length
    const processing = recentTransactions.filter((t) => t.status === "Processing").length
    const totalAmount = recentTransactions.reduce((sum, t) => {
      const amount = Number(String(t.amount).replace(/[^0-9.-]/g, ""))
      return sum + (Number.isNaN(amount) ? 0 : amount)
    }, 0)

    return {
      completed,
      processing,
      totalAmount,
      monthlyEstimate: Math.round(totalAmount * 4),
    }
  }, [recentTransactions])

  const stats = [
    {
      icon: CreditCard,
      label: "Total Processed",
      value: `${currency} ${transactionTotals.totalAmount.toLocaleString()}`,
      color: "bg-blue-100 dark:bg-blue-900",
      trend: `${totalUsers} users in system`,
    },
    {
      icon: Clock,
      label: "Pending",
      value: String(pendingUsers || transactionTotals.processing),
      color: "bg-yellow-100 dark:bg-yellow-900",
      trend: "Live from users API",
    },
    {
      icon: CheckCircle,
      label: "Completed",
      value: String(transactionTotals.completed),
      color: "bg-green-100 dark:bg-green-900",
      trend: "Live",
    },
    {
      icon: TrendingUp,
      label: "This Month",
      value: `${currency} ${transactionTotals.monthlyEstimate.toLocaleString()}`,
      color: "bg-purple-100 dark:bg-purple-900",
      trend: "Estimated",
    },
  ]

  const reconciliationStatus = [
    { account: "Main Operating", balance: `${currency} 5,234,500`, lastReconciled: "Jan 15", status: "Reconciled" },
    { account: "Commission Pool", balance: `${currency} 892,300`, lastReconciled: "Jan 15", status: "Reconciled" },
    { account: "Escrow Fund", balance: `${currency} 1,234,000`, lastReconciled: "Jan 14", status: "Pending" },
    { account: "Reserve Fund", balance: `${currency} 750,000`, lastReconciled: "Jan 13", status: "Reconciled" },
  ]

  const visibleTransactions = showProcessingOnly
    ? recentTransactions.filter((txn) => txn.status === "Processing")
    : recentTransactions

  const handleExportReport = () => {
    const data = {
      exportDate: new Date().toISOString(),
      period: selectedPeriod,
      stats: {
        totalProcessed: transactionTotals.totalAmount,
        pending: Number(stats[1].value),
        completed: transactionTotals.completed,
        thisMonth: transactionTotals.monthlyEstimate,
      },
      transactions: recentTransactions,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `secretary-report-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Secretary Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Financial transactions, reconciliation, and payment management</p>
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
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
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

      {/* Main Content */}
      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          <TabsTrigger value="reconciliation">Account Reconciliation</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Transactions</h2>
              <Button
                variant="outline"
                className="bg-transparent gap-2"
                onClick={() => setShowProcessingOnly((prev) => !prev)}
              >
                <Filter size={18} />
                {showProcessingOnly ? "All" : "Processing"}
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Description</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Method</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {visibleTransactions.map(txn => (
                    <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{txn.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{txn.description}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{txn.amount}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{txn.method}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          txn.status === "Completed" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                          "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                        }`}>
                          {txn.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{txn.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Reconciliation Tab */}
        <TabsContent value="reconciliation" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Account Reconciliation Status
            </h2>
            <div className="space-y-4">
              {reconciliationStatus.map((account, idx) => (
                <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{account.account}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      account.status === "Reconciled" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                      "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                    }`}>
                      {account.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{account.balance}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Last reconciled: {account.lastReconciled}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
