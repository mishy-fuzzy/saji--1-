"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertCircle, Download, Search } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type ReconciliationRow = {
  id: string
  date: string
  account: string
  systemBalance: string
  bankBalance: string
  variance: string
  status: "Pending" | "Reconciled" | "Under Review"
}

type DiscrepancyRow = {
  id: string
  date: string
  description: string
  amount: string
  status: string
  resolution: string
}

type ReconciliationLine = {
  type: "in" | "out"
  description: string
  date: string
  amount: string
}

export default function BankReconciliationPage() {
  const [reconciliations, setReconciliations] = useState<ReconciliationRow[]>([])
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyRow[]>([])
  const [reconciliationData, setReconciliationData] = useState<ReconciliationLine[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const loadReconciliation = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/secretary/reconciliation", {
          cache: "no-store",
          signal: controller.signal,
        })
        const payload = await response.json()

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || "Failed to load reconciliation data")
        }

        setReconciliations(
          Array.isArray(payload?.data?.reconciliations)
            ? payload.data.reconciliations.map((row: Partial<ReconciliationRow>) => ({
                id: String(row.id || ""),
                date: String(row.date || ""),
                account: String(row.account || "Payment"),
                systemBalance: String(row.systemBalance || "KES 0"),
                bankBalance: String(row.bankBalance || "KES 0"),
                variance: String(row.variance || "KES 0"),
                status: (String(row.status || "Pending") as ReconciliationRow["status"]),
              }))
            : [],
        )

        setDiscrepancies(
          Array.isArray(payload?.data?.discrepancies)
            ? payload.data.discrepancies.map((row: Partial<DiscrepancyRow>) => ({
                id: String(row.id || ""),
                date: String(row.date || ""),
                description: String(row.description || "Discrepancy"),
                amount: String(row.amount || "KES 0"),
                status: String(row.status || "Open"),
                resolution: String(row.resolution || "Review required"),
              }))
            : [],
        )

        setReconciliationData(
          Array.isArray(payload?.data?.reconciliationData)
            ? payload.data.reconciliationData.map((row: Partial<ReconciliationLine>) => ({
                type: row.type === "out" ? "out" : "in",
                description: String(row.description || "Transaction"),
                date: String(row.date || ""),
                amount: String(row.amount || "KES 0"),
              }))
            : [],
        )
      } catch (err) {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : "Failed to load reconciliation data")
        setReconciliations([])
        setDiscrepancies([])
        setReconciliationData([])
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadReconciliation()
    const intervalId = window.setInterval(loadReconciliation, 30000)

    return () => {
      controller.abort()
      window.clearInterval(intervalId)
    }
  }, [])

  const filteredReconciliations = useMemo(() => {
    return reconciliations.filter((item) =>
      item.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [reconciliations, searchTerm])

  const stats = useMemo(() => {
    const totalVariance = reconciliations.reduce((sum, item) => sum + (item.status === "Reconciled" ? 0 : Number(item.variance.replace(/[^\d.-]/g, "")) || 0), 0)
    const reconciled = reconciliations.filter((item) => item.status === "Reconciled").length
    const percentage = reconciliations.length ? Math.round((reconciled / reconciliations.length) * 100) : 0

    return [
      { label: "System Balance", value: reconciliations[0]?.systemBalance || "KES 0" },
      { label: "Bank Balance", value: reconciliations[0]?.bankBalance || "KES 0" },
      { label: "Total Variance", value: `KES ${Math.abs(totalVariance).toLocaleString()}` },
      { label: "Reconciled %", value: `${percentage}%` },
    ]
  }, [reconciliations])

  const exportReconciliation = () => {
    const data = {
      exportDate: new Date().toISOString(),
      reconciliations,
      discrepancies,
      reconciliationData,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reconciliation-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Bank Reconciliation</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Database-backed reconciliation review for finance operations</p>
        </div>
        <Button onClick={exportReconciliation} variant="outline" className="bg-transparent gap-2">
          <Download size={18} />
          Export
        </Button>
      </div>

      {error ? (
        <Card className="p-4 border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm">
          Failed to load reconciliation data from the database: {error}
        </Card>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-6">
            <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search reconciliations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Account Reconciliations</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Account</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">System Balance</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Bank Balance</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Variance</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    Loading reconciliation data from the database...
                  </td>
                </tr>
              ) : filteredReconciliations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No reconciliations available.
                  </td>
                </tr>
              ) : (
                filteredReconciliations.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{rec.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{rec.account}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{rec.systemBalance}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{rec.bankBalance}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{rec.variance}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          rec.status === "Reconciled"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : rec.status === "Pending"
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                              : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Reconciliation Details</h2>
        <div className="space-y-3">
          {reconciliationData.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${item.type === "in" ? "bg-green-600" : "bg-red-600"}`}></div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{item.description}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.date}</p>
                </div>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white">{item.amount}</p>
            </div>
          ))}
          {!reconciliationData.length && !isLoading && (
            <p className="text-sm text-gray-500 dark:text-gray-400">No reconciliation line items available.</p>
          )}
        </div>
      </Card>

      <Card className="p-6 border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <AlertCircle className="w-6 h-6 text-yellow-600" />
          Discrepancies Found ({discrepancies.length})
        </h2>
        <div className="space-y-3">
          {discrepancies.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{item.description}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {item.id} • {item.date} • {item.amount}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Resolution: {item.resolution}</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                {item.status}
              </span>
            </div>
          ))}
          {!discrepancies.length && !isLoading && (
            <p className="text-sm text-gray-500 dark:text-gray-400">No discrepancies found.</p>
          )}
        </div>
      </Card>
    </div>
  )
}
