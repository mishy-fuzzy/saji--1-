"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Download, Eye, Filter, Search, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Dispute = {
  id: string
  disputeId: string
  customer: string
  provider: string
  status: "Open" | "In Progress" | "Resolved"
  severity: "High" | "Medium" | "Low"
  amount: string
  date: string
  description: string
  resolution: string
  notes: string
}

function normalizeDisputeStatus(status: string): Dispute["status"] {
  const value = String(status || "open").toLowerCase()
  if (value === "resolved") return "Resolved"
  if (value === "in progress" || value === "under_review") return "In Progress"
  return "Open"
}

function normalizeSeverity(severity: string): Dispute["severity"] {
  const value = String(severity || "Low").toLowerCase()
  if (value === "high") return "High"
  if (value === "medium") return "Medium"
  return "Low"
}

export default function AgentDisputes() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "in-progress" | "resolved">("all")
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const loadDisputes = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/agent/disputes", {
          cache: "no-store",
          headers: {
            "x-user-role": "agent",
          },
          signal: controller.signal,
        })
        const payload = await response.json()

        if (!response.ok || !payload?.ok || !Array.isArray(payload?.data)) {
          throw new Error(payload?.error || "Failed to load disputes")
        }

        const mapped = payload.data.map(
          (row: {
            id?: string
            disputeId?: string
            customer?: string
            provider?: string
            status?: string
            severity?: string
            amount?: string
            date?: string
            description?: string
            resolution?: string
            notes?: string
          }) => ({
            id: String(row.id || ""),
            disputeId: String(row.disputeId || row.id || "DSP-000"),
            customer: String(row.customer || "Unknown"),
            provider: String(row.provider || "Unassigned"),
            status: normalizeDisputeStatus(String(row.status || "Open")),
            severity: normalizeSeverity(String(row.severity || "Low")),
            amount: String(row.amount || "KES 0"),
            date: String(row.date || ""),
            description: String(row.description || "Dispute requires review"),
            resolution: String(row.resolution || "Pending"),
            notes: String(row.notes || ""),
          }),
        ) as Dispute[]

        setDisputes(mapped)
      } catch (err) {
        if (controller.signal.aborted) return
        const message = err instanceof Error ? err.message : "Failed to load disputes"
        setError(message)
        setDisputes([])
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadDisputes()
    const intervalId = window.setInterval(loadDisputes, 30000)

    return () => {
      controller.abort()
      window.clearInterval(intervalId)
    }
  }, [])

  const filteredDisputes = useMemo(() => {
    return disputes.filter((dispute) => {
      const matchesSearch =
        dispute.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.id.toLowerCase().includes(searchTerm.toLowerCase())

      const normalizedStatus = dispute.status.toLowerCase().replace(" ", "-")
      const matchesStatus = statusFilter === "all" || normalizedStatus === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [disputes, searchTerm, statusFilter])

  const stats = useMemo(
    () => [
      { label: "Total Disputes", value: disputes.length },
      { label: "Open", value: disputes.filter((d) => d.status === "Open").length },
      { label: "In Progress", value: disputes.filter((d) => d.status === "In Progress").length },
      { label: "Resolved", value: disputes.filter((d) => d.status === "Resolved").length },
    ],
    [disputes],
  )

  const handleViewDispute = (dispute: Dispute) => {
    setSelectedDispute(dispute)
    setShowModal(true)
  }

  const handleExportDisputes = () => {
    const data = {
      exportDate: new Date().toISOString(),
      totalDisputes: disputes.length,
      disputes,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `disputes-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Dispute Management</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Live disputes assigned to your account</p>
            </div>
          </div>
        </div>
        <Button onClick={handleExportDisputes} variant="outline" className="bg-transparent gap-2">
          <Download size={18} />
          Export
        </Button>
      </div>

      {error ? (
        <Card className="p-4 border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm">
          Failed to load disputes from the database: {error}
        </Card>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search disputes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Button
          variant="outline"
          className="bg-transparent gap-2"
          onClick={() =>
            setStatusFilter((prev) => {
              if (prev === "all") return "open"
              if (prev === "open") return "in-progress"
              if (prev === "in-progress") return "resolved"
              return "all"
            })
          }
        >
          <Filter size={18} />
          {statusFilter === "all" ? "Filter" : `Status: ${statusFilter}`}
        </Button>
      </div>

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Customer</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Provider</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Severity</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    Loading disputes from the database...
                  </td>
                </tr>
              ) : filteredDisputes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No disputes found.
                  </td>
                </tr>
              ) : (
                filteredDisputes.map((dispute) => (
                  <tr key={dispute.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{dispute.disputeId}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{dispute.customer}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{dispute.provider}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          dispute.status === "Open"
                            ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                            : dispute.status === "In Progress"
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                              : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        }`}
                      >
                        {dispute.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{dispute.severity}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{dispute.amount}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewDispute(dispute)}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && selectedDispute ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dispute Details</h2>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  <X size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="space-y-3">
                {[
                  ["Dispute ID", selectedDispute.disputeId],
                  ["Customer", selectedDispute.customer],
                  ["Provider", selectedDispute.provider],
                  ["Date", selectedDispute.date || "N/A"],
                  ["Status", selectedDispute.status],
                  ["Severity", selectedDispute.severity],
                  ["Amount", selectedDispute.amount],
                  ["Resolution", selectedDispute.resolution],
                  ["Notes", selectedDispute.notes || "No additional notes"],
                  ["Description", selectedDispute.description],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{label}</span>
                    <span className="font-medium text-gray-900 dark:text-white text-right">{String(value)}</span>
                  </div>
                ))}
              </div>

              <Button className="w-full" variant="outline" onClick={() => setShowModal(false)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
