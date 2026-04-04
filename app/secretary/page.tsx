"use client"

import { useEffect, useMemo, useState } from "react"
import { useLocalization } from "@/lib/hooks/useLocalization"
import { CreditCard, TrendingUp, Clock, CheckCircle, AlertCircle, Download, Filter, BarChart3 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SecretaryDashboard() {
  const { currency } = useLocalization()
  const [totalTransactions, setTotalTransactions] = useState(0)
  const [processingTransactions, setProcessingTransactions] = useState(0)
  const [selectedPeriod, setSelectedPeriod] = useState("week")
  const [showProcessingOnly, setShowProcessingOnly] = useState(false)
  const [recentTransactions, setRecentTransactions] = useState<Array<{ id: string; description: string; amount: string; status: string; date: string; method: string }>>([])
  const [reconciliationStatus, setReconciliationStatus] = useState<Array<{ account: string; balance: string; lastReconciled: string; status: string }>>([])

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch("/api/secretary/dashboard", {
          cache: "no-store",
          headers: {
            "x-user-role": "secretary",
          },
        })
        const payload = await response.json()

        if (!response.ok || !payload?.ok || !payload?.data) {
          return
        }

        setTotalTransactions(Number(payload?.data?.totals?.totalTransactions || 0))
        setProcessingTransactions(Number(payload?.data?.totals?.processingTransactions || 0))
        setRecentTransactions(Array.isArray(payload?.data?.recentTransactions) ? payload.data.recentTransactions : [])
        setReconciliationStatus(Array.isArray(payload?.data?.reconciliationStatus) ? payload.data.reconciliationStatus : [])
      } catch {
        // Keep dashboard usable even if API is temporarily unavailable.
      }
    }

    fetchDashboard()
    const intervalId = window.setInterval(fetchDashboard, 25000)
    return () => window.clearInterval(intervalId)
  }, [])

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
      trend: `${totalTransactions} transactions logged`,
    },
    {
      icon: Clock,
      label: "Pending",
      value: String(processingTransactions || transactionTotals.processing),
      color: "bg-yellow-100 dark:bg-yellow-900",
      trend: "Live from payments API",
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
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 text-white shadow-2xl shadow-black/20 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
              Treasury Operations
            </div>
            <h1 className="text-3xl font-bold tracking-tight lg:text-5xl">
              Secretary Dashboard
            </h1>
            <p className="max-w-xl text-sm text-slate-300 lg:text-base">
              Live transaction flow, reconciliation status, and settlement tracking from the database.
            </p>
          </div>
          <Button onClick={handleExportReport} className="gap-2 bg-emerald-400 text-slate-950 hover:bg-emerald-300">
          <Download size={18} />
          Export Report
        </Button>
        </div>
      </section>

      {/* Period Selector */}
      <div className="flex flex-wrap gap-2">
        {['day', 'week', 'month'].map(period => (
          <Button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            variant={selectedPeriod === period ? "default" : "outline"}
            className={selectedPeriod === period ? "bg-emerald-400 text-slate-950 hover:bg-emerald-300" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"}
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
            <Card key={idx} className="border-white/10 bg-white/5 p-6 shadow-none backdrop-blur-sm transition-shadow hover:bg-white/10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="mb-2 text-sm text-slate-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="mt-2 text-xs text-emerald-300">{stat.trend}</p>
                </div>
                <div className={`${stat.color} rounded-xl p-3`}>
                  <Icon className="w-6 h-6 text-slate-800 dark:text-slate-900" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 border border-white/10 bg-white/5">
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          <TabsTrigger value="reconciliation">Account Reconciliation</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card className="border-white/10 bg-slate-950/60 p-6 shadow-none backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Recent Transactions</h2>
              <Button
                variant="outline"
                className="gap-2 border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                onClick={() => setShowProcessingOnly((prev) => !prev)}
              >
                <Filter size={18} />
                {showProcessingOnly ? "All" : "Processing"}
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Description</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Method</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {visibleTransactions.map(txn => (
                    <tr key={txn.id} className="transition-colors hover:bg-white/5">
                      <td className="px-6 py-4 text-sm font-medium text-white">{txn.id}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{txn.description}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-white">{txn.amount}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{txn.method}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          txn.status === "Completed" ? "bg-emerald-400/15 text-emerald-300" :
                          "bg-amber-400/15 text-amber-300"
                        }`}>
                          {txn.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">{txn.date}</td>
                    </tr>
                  ))}
                  {visibleTransactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-400">
                        No transactions available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Reconciliation Tab */}
        <TabsContent value="reconciliation" className="space-y-4">
          <Card className="border-white/10 bg-slate-950/60 p-6 shadow-none backdrop-blur-sm">
            <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-white">
              <BarChart3 className="w-6 h-6" />
              Account Reconciliation Status
            </h2>
            <div className="space-y-4">
              {reconciliationStatus.map((account, idx) => (
                <div key={idx} className="rounded-2xl border border-white/10 p-4 transition-colors hover:bg-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white">{account.account}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      account.status === "Reconciled" ? "bg-emerald-400/15 text-emerald-300" :
                      "bg-amber-400/15 text-amber-300"
                    }`}>
                      {account.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-white">{account.balance}</p>
                      <p className="mt-1 text-sm text-slate-400">Last reconciled: {account.lastReconciled}</p>
                    </div>
                  </div>
                </div>
              ))}
              {reconciliationStatus.length === 0 && (
                <p className="text-sm text-slate-400">No reconciliation records available.</p>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
