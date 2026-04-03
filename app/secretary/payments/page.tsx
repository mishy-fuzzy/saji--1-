"use client"

import { useEffect, useMemo, useState } from "react"
import { Download, Filter, Search, Send } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type PaymentRow = {
  id: string
  recipient: string
  amount: number
  method: string
  status: "Completed" | "Processing" | "Pending" | "Failed"
  fee: number
  reference: string
  description: string
  date: string
}

export default function SecretaryPayments() {
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showPendingOnly, setShowPendingOnly] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const loadPayments = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/secretary/payments", {
          cache: "no-store",
          signal: controller.signal,
        })
        const payload = await response.json()

        if (!response.ok || !payload?.ok || !Array.isArray(payload?.data?.payments)) {
          throw new Error(payload?.error || "Failed to load payments")
        }

        setPayments(
          payload.data.payments.map((row: Partial<PaymentRow>) => ({
            id: String(row.id || ""),
            recipient: String(row.recipient || "Recipient"),
            amount: Number(row.amount || 0),
            method: String(row.method || "Wallet"),
            status: (String(row.status || "Pending") as PaymentRow["status"]),
            fee: Number(row.fee || 0),
            reference: String(row.reference || ""),
            description: String(row.description || "Payment transaction"),
            date: String(row.date || ""),
          })),
        )
      } catch (err) {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : "Failed to load payments")
        setPayments([])
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadPayments()
    const intervalId = window.setInterval(loadPayments, 30000)

    return () => {
      controller.abort()
      window.clearInterval(intervalId)
    }
  }, [])

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchesSearch =
        payment.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.reference.toLowerCase().includes(searchTerm.toLowerCase())

      if (!matchesSearch) return false
      if (!showPendingOnly) return true
      return payment.status === "Pending" || payment.status === "Processing"
    })
  }, [payments, searchTerm, showPendingOnly])

  const paymentStats = useMemo(() => {
    const totalProcessed = payments
      .filter((payment) => payment.status === "Completed")
      .reduce((sum, payment) => sum + payment.amount, 0)
    const pending = payments.filter((payment) => payment.status === "Pending" || payment.status === "Processing").length
    const today = payments.filter((payment) => payment.date).slice(0, 1).reduce((sum, payment) => sum + payment.amount, 0)
    const thisMonth = payments.reduce((sum, payment) => sum + payment.amount, 0)

    return [
      { label: "Total Processed", value: `KES ${totalProcessed.toLocaleString()}`, change: payments.length ? "+live" : "No data" },
      { label: "Pending", value: String(pending), change: payments.length ? "Live queue" : "No data" },
      { label: "Today", value: `KES ${today.toLocaleString()}`, change: payments.length ? "Live snapshot" : "No data" },
      { label: "This Month", value: `KES ${thisMonth.toLocaleString()}`, change: payments.length ? "Live snapshot" : "No data" },
    ]
  }, [payments])

  const exportPayments = () => {
    const data = {
      exportDate: new Date().toISOString(),
      totalPayments: payments.length,
      payments,
      stats: paymentStats,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `payments-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Payment Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Live payment transactions from the database</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportPayments} variant="outline" className="bg-transparent gap-2">
            <Download size={18} />
            Export
          </Button>
          <Button variant="outline" className="bg-transparent gap-2" onClick={() => setShowPendingOnly((prev) => !prev)}>
            <Filter size={18} />
            {showPendingOnly ? "All" : "Pending"}
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="p-4 border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm">
          Failed to load payments from the database: {error}
        </Card>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {paymentStats.map((stat) => (
          <Card key={stat.label} className="p-6">
            <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">{stat.change}</p>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Payment Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Recipient</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Method</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    Loading payments from the database...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No payments available.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{payment.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{payment.recipient}</p>
                        <p className="text-xs text-gray-500">{payment.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">KES {payment.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{payment.method}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          payment.status === "Completed"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : payment.status === "Processing"
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                              : payment.status === "Failed"
                                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{payment.reference || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
