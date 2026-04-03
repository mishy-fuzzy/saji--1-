"use client"

import { useEffect, useMemo, useState } from "react"
import { Download, FileText, Search } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Invoice = {
  id: string
  client: string
  service: string
  amount: number
  tax: number
  total: number
  dueDate: string
  date: string
  status: "Paid" | "Pending" | "Overdue" | "Draft"
}

export default function InvoicingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<Invoice["status"] | "All">("All")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const loadInvoices = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/secretary/invoices", {
          cache: "no-store",
          signal: controller.signal,
        })
        const payload = await response.json()

        if (!response.ok || !payload?.ok || !Array.isArray(payload?.data?.invoices)) {
          throw new Error(payload?.error || "Failed to load invoices")
        }

        setInvoices(
          payload.data.invoices.map((row: Partial<Invoice>) => ({
            id: String(row.id || ""),
            client: String(row.client || "Client"),
            service: String(row.service || "Service"),
            amount: Number(row.amount || 0),
            tax: Number(row.tax || 0),
            total: Number(row.total || 0),
            dueDate: String(row.dueDate || ""),
            date: String(row.date || ""),
            status: (String(row.status || "Draft") as Invoice["status"]),
          })),
        )
      } catch (err) {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : "Failed to load invoices")
        setInvoices([])
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadInvoices()
    const intervalId = window.setInterval(loadInvoices, 30000)

    return () => {
      controller.abort()
      window.clearInterval(intervalId)
    }
  }, [])

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.id.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesFilter = filter === "All" || invoice.status === filter
      return matchesSearch && matchesFilter
    })
  }, [filter, invoices, searchTerm])

  const summaryData = useMemo(
    () => [
      { label: "Total Invoiced", value: invoices.length.toString(), trend: invoices.length ? "Live" : "No data" },
      { label: "Paid", value: invoices.filter((invoice) => invoice.status === "Paid").length.toString(), trend: "Live" },
      { label: "Pending", value: invoices.filter((invoice) => invoice.status === "Pending").length.toString(), trend: "Live" },
      { label: "Overdue", value: invoices.filter((invoice) => invoice.status === "Overdue").length.toString(), trend: "Live" },
    ],
    [invoices],
  )

  const exportInvoices = () => {
    const data = {
      exportDate: new Date().toISOString(),
      totalInvoices: invoices.length,
      invoices,
      summary: summaryData,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `invoices-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Invoicing & Billing</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Live invoices backed by payment transaction records</p>
        </div>
        <Button onClick={exportInvoices} variant="outline" className="bg-transparent gap-2">
          <Download size={18} />
          Export
        </Button>
      </div>

      {error ? (
        <Card className="p-4 border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm">
          Failed to load invoices from the database: {error}
        </Card>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryData.map((item) => (
          <Card key={item.label} className="p-6">
            <p className="text-sm text-muted-foreground mb-2">{item.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">{item.trend}</p>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["All", "Draft", "Pending", "Paid", "Overdue"] as const).map((option) => (
          <button
            key={option}
            onClick={() => setFilter(option)}
            className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${
              filter === option
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Invoices ({filteredInvoices.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Invoice ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Client</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Service</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Tax</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Total</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    Loading invoices from the database...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No invoices available.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{invoice.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{invoice.client}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{invoice.service}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">KES {invoice.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">KES {invoice.tax.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">KES {invoice.total.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          invoice.status === "Paid"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : invoice.status === "Pending"
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                              : invoice.status === "Overdue"
                                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{invoice.dueDate || invoice.date}</td>
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
