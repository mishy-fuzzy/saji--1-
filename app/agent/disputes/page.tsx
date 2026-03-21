"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Eye, X, Search, Filter, Download } from "lucide-react"

export default function AgentDisputes() {
  const [disputes, setDisputes] = useState([
    { id: "DSP-001", customer: "Alice Johnson", provider: "John Smith", status: "Open", severity: "High", amount: "KES 5,000", date: "Jan 15", description: "Payment mismatch issue", resolution: "Pending", notes: "Customer reports incorrect charge" },
    { id: "DSP-002", customer: "Bob Wilson", provider: "Emma Davis", status: "In Progress", severity: "Medium", amount: "KES 3,500", date: "Jan 14", description: "Service quality complaint", resolution: "In Review", notes: "Escalated to manager" },
    { id: "DSP-003", customer: "Charlie Lee", provider: "Michael Brown", status: "Resolved", severity: "Low", amount: "KES 2,000", date: "Jan 13", description: "Transaction delay", resolution: "Resolved Successfully", notes: "Refund processed" },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "in-progress" | "resolved">("all")
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add")
  const [selectedDispute, setSelectedDispute] = useState<any>(null)
  const [formData, setFormData] = useState({ customer: "", provider: "", status: "Open", severity: "Medium", amount: "", description: "", notes: "" })

  const filteredDisputes = disputes.filter(d => {
    const matchesSearch =
      d.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.id.toLowerCase().includes(searchTerm.toLowerCase())

    const normalizedStatus = d.status.toLowerCase().replace(" ", "-")
    const matchesStatus = statusFilter === "all" || normalizedStatus === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleAddDispute = () => {
    setFormData({ customer: "", provider: "", status: "Open", severity: "Medium", amount: "", description: "", notes: "" })
    setModalMode("add")
    setSelectedDispute(null)
    setShowModal(true)
  }

  const handleViewDispute = (dispute: any) => {
    setSelectedDispute(dispute)
    setFormData(dispute)
    setModalMode("view")
    setShowModal(true)
  }

  const handleEditDispute = (dispute: any) => {
    setSelectedDispute(dispute)
    setFormData(dispute)
    setModalMode("edit")
    setShowModal(true)
  }

  const handleSaveDispute = () => {
    if (modalMode === "add") {
      const newDispute = {
        id: `DSP-${String(disputes.length + 1).padStart(3, "0")}`,
        ...formData,
        date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
      }
      setDisputes([newDispute, ...disputes])
      console.log("[v0] New dispute created:", newDispute)
    } else if (modalMode === "edit") {
      setDisputes(disputes.map(d => d.id === selectedDispute.id ? { ...d, ...formData } : d))
      console.log("[v0] Dispute updated:", formData)
    }
    setShowModal(false)
  }

  const handleDeleteDispute = (disputeId: string) => {
    if (confirm("Are you sure you want to delete this dispute?")) {
      setDisputes(disputes.filter(d => d.id !== disputeId))
      console.log("[v0] Dispute deleted:", disputeId)
    }
  }

  const handleExportDisputes = () => {
    const data = {
      exportDate: new Date().toISOString(),
      totalDisputes: disputes.length,
      disputes: disputes
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `disputes-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
    console.log("[v0] Disputes exported successfully")
  }

  const stats = [
    { label: "Total Disputes", value: disputes.length },
    { label: "Open", value: disputes.filter(d => d.status === "Open").length },
    { label: "In Progress", value: disputes.filter(d => d.status === "In Progress").length },
    { label: "Resolved", value: disputes.filter(d => d.status === "Resolved").length },
  ]

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Dispute Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Review and resolve customer disputes</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportDisputes} variant="outline" className="bg-transparent gap-2">
            <Download size={18} />
            Export
          </Button>
          <Button onClick={handleAddDispute} className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Plus size={18} />
            New Dispute
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="p-4">
            <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Search and Filter */}
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

      {/* Disputes Table */}
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
              {filteredDisputes.map(dispute => (
                <tr key={dispute.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{dispute.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{dispute.customer}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{dispute.provider}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      dispute.status === "Open" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" :
                      dispute.status === "In Progress" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" :
                      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    }`}>
                      {dispute.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{dispute.severity}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{dispute.amount}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <button
                      onClick={() => handleViewDispute(dispute)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleEditDispute(dispute)}
                      className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteDispute(dispute.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Dispute Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {modalMode === "add" ? "Create Dispute" : modalMode === "edit" ? "Edit Dispute" : "View Dispute"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Customer</label>
                  <input
                    type="text"
                    value={formData.customer}
                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                    disabled={modalMode === "view"}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Provider</label>
                  <input
                    type="text"
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    disabled={modalMode === "view"}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Amount</label>
                  <input
                    type="text"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    disabled={modalMode === "view"}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    disabled={modalMode === "view"}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option>Open</option>
                    <option>In Progress</option>
                    <option>Resolved</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Severity</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    disabled={modalMode === "view"}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={modalMode === "view"}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Resolution Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    disabled={modalMode === "view"}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                {modalMode !== "view" && (
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleSaveDispute}>
                    Save Dispute
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
