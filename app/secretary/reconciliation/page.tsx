"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, AlertCircle, CheckCircle, Plus, Edit, Trash2, Eye, X, Search } from "lucide-react"

export default function BankReconciliationPage() {
  const [reconciliations, setReconciliations] = useState([
    { id: "REC-001", date: "Jan 15", account: "Main Operating", systemBalance: "KES 5,234,500", bankBalance: "KES 5,239,400", variance: "KES 4,900", status: "Pending" },
    { id: "REC-002", date: "Jan 14", account: "Commission Pool", systemBalance: "KES 892,300", bankBalance: "KES 892,300", variance: "KES 0", status: "Reconciled" },
    { id: "REC-003", date: "Jan 13", account: "Escrow Fund", systemBalance: "KES 1,234,000", bankBalance: "KES 1,230,000", variance: "KES 4,000", status: "Under Review" },
  ])

  const [discrepancies, setDiscrepancies] = useState([
    { id: "DIS-001", date: "Jan 10", description: "Missing deposit record", amount: "KES 5,000", status: "Under review", resolution: "Investigating" },
    { id: "DIS-002", date: "Jan 8", description: "Duplicate charge", amount: "KES 2,500", status: "Resolved", resolution: "Refunded" },
  ])

  const [reconciliationData, setReconciliationData] = useState([
    { type: "in", description: "Deposit", date: "Jan 15", amount: "KES 5,234,500" },
    { type: "out", description: "Withdrawal", date: "Jan 14", amount: "KES 2,500" },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add")
  const [selectedReconciliation, setSelectedReconciliation] = useState<any>(null)
  const [formData, setFormData] = useState({ account: "", date: "", systemBalance: "", bankBalance: "", variance: "", status: "Pending" })

  const filteredReconciliations = reconciliations.filter(r =>
    r.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddReconciliation = () => {
    setFormData({ account: "", date: "", systemBalance: "", bankBalance: "", variance: "", status: "Pending" })
    setModalMode("add")
    setSelectedReconciliation(null)
    setShowModal(true)
  }

  const handleViewReconciliation = (rec: any) => {
    setSelectedReconciliation(rec)
    setFormData(rec)
    setModalMode("view")
    setShowModal(true)
  }

  const handleEditReconciliation = (rec: any) => {
    setSelectedReconciliation(rec)
    setFormData(rec)
    setModalMode("edit")
    setShowModal(true)
  }

  const handleSaveReconciliation = () => {
    if (modalMode === "add") {
      const newRec = {
        id: `REC-${String(reconciliations.length + 1).padStart(3, "0")}`,
        ...formData
      }
      setReconciliations([newRec, ...reconciliations])
      console.log("[v0] New reconciliation created:", newRec)
    } else if (modalMode === "edit") {
      setReconciliations(reconciliations.map(r => r.id === selectedReconciliation.id ? { ...r, ...formData } : r))
      console.log("[v0] Reconciliation updated:", formData)
    }
    setShowModal(false)
  }

  const handleDeleteReconciliation = (recId: string) => {
    if (confirm("Are you sure you want to delete this reconciliation?")) {
      setReconciliations(reconciliations.filter(r => r.id !== recId))
      console.log("[v0] Reconciliation deleted:", recId)
    }
  }

  const handleExportReconciliation = () => {
    const data = {
      exportDate: new Date().toISOString(),
      reconciliations: reconciliations,
      discrepancies: discrepancies
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reconciliation-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
    console.log("[v0] Reconciliation exported successfully")
  }

  const stats = [
    { label: "System Balance", value: "KES 5,234,500" },
    { label: "Bank Balance", value: "KES 5,239,400" },
    { label: "Total Variance", value: "KES 8,900" },
    { label: "Reconciled %", value: "94%" },
  ]

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Bank Reconciliation</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Reconcile bank statements with system records</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportReconciliation} variant="outline" className="bg-transparent gap-2">
            <Download size={18} />
            Export
          </Button>
          <Button onClick={handleAddReconciliation} className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Plus size={18} />
            New
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="p-6">
            <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Search */}
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

      {/* Reconciliations Table */}
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
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredReconciliations.map(rec => (
                <tr key={rec.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{rec.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{rec.account}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{rec.systemBalance}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{rec.bankBalance}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{rec.variance}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      rec.status === "Reconciled" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                      rec.status === "Pending" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" :
                      "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                    }`}>
                      {rec.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button
                      onClick={() => handleViewReconciliation(rec)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleEditReconciliation(rec)}
                      className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteReconciliation(rec.id)}
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

      {/* Reconciliation Details */}
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
        </div>
      </Card>

      {/* Discrepancies */}
      {discrepancies.length > 0 && (
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.id} • {item.date} • {item.amount}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Resolution: {item.resolution}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.status === "Resolved" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                    "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Reconciliation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {modalMode === "add" ? "New Reconciliation" : modalMode === "edit" ? "Edit Reconciliation" : "View Reconciliation"}
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
                  <label className="text-sm text-gray-600 dark:text-gray-400">Account</label>
                  <input
                    type="text"
                    value={formData.account}
                    onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                    disabled={modalMode === "view"}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    disabled={modalMode === "view"}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">System Balance</label>
                  <input
                    type="text"
                    value={formData.systemBalance}
                    onChange={(e) => setFormData({ ...formData, systemBalance: e.target.value })}
                    disabled={modalMode === "view"}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Bank Balance</label>
                  <input
                    type="text"
                    value={formData.bankBalance}
                    onChange={(e) => setFormData({ ...formData, bankBalance: e.target.value })}
                    disabled={modalMode === "view"}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Variance</label>
                  <input
                    type="text"
                    value={formData.variance}
                    onChange={(e) => setFormData({ ...formData, variance: e.target.value })}
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
                    <option>Pending</option>
                    <option>Under Review</option>
                    <option>Reconciled</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                {modalMode !== "view" && (
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleSaveReconciliation}>
                    Save
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
