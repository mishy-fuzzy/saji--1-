"use client"

import { useState } from "react"
import { useLocalization } from "@/lib/hooks/useLocalization"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Eye, X, Search, Filter, Download, Send } from "lucide-react"

export default function SecretaryPayments() {
  const { currency } = useLocalization()

  const [payments, setPayments] = useState([
    { id: "PAY-001", recipient: "Agent AGT-001", amount: "KES 45,000", method: "Bank Transfer", status: "Completed", date: "Jan 15", description: "Commission Payout", reference: "AGT-001-JAN" },
    { id: "PAY-002", recipient: "Customer CUS-234", amount: "KES 12,500", method: "M-Pesa", status: "Pending", date: "Jan 14", description: "Refund", reference: "CUS-234-REF" },
    { id: "PAY-003", recipient: "Provider PRV-567", amount: "KES 38,200", method: "Bank Transfer", status: "Processing", date: "Jan 13", description: "Withdrawal Request", reference: "PRV-567-WD" },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add")
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [formData, setFormData] = useState({ recipient: "", amount: "", method: "Bank Transfer", status: "Pending", description: "", reference: "" })
  const [showPendingOnly, setShowPendingOnly] = useState(false)

  const filteredPayments = payments.filter(p => {
    const matchesSearch =
      p.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchesSearch) return false
    if (!showPendingOnly) return true
    return p.status === "Pending" || p.status === "Processing"
  })

  const paymentStats = [
    { label: "Total Processed", value: `${currency} 2,450,000`, change: "+18%" },
    { label: "Pending", value: "8", change: "-2" },
    { label: "Today", value: `${currency} 125,400`, change: "+12%" },
    { label: "This Month", value: `${currency} 450,000`, change: "+22%" },
  ]

  const handleAddPayment = () => {
    setFormData({ recipient: "", amount: "", method: "Bank Transfer", status: "Pending", description: "", reference: "" })
    setModalMode("add")
    setSelectedPayment(null)
    setShowModal(true)
  }

  const handleViewPayment = (payment: any) => {
    setSelectedPayment(payment)
    setFormData(payment)
    setModalMode("view")
    setShowModal(true)
  }

  const handleEditPayment = (payment: any) => {
    setSelectedPayment(payment)
    setFormData(payment)
    setModalMode("edit")
    setShowModal(true)
  }

  const handleSavePayment = () => {
    if (modalMode === "add") {
      const newPayment = {
        id: `PAY-${String(payments.length + 1).padStart(3, "0")}`,
        ...formData,
        date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
      }
      setPayments([newPayment, ...payments])
      console.log("[v0] New payment created:", newPayment)
    } else if (modalMode === "edit") {
      setPayments(payments.map(p => p.id === selectedPayment.id ? { ...p, ...formData } : p))
      console.log("[v0] Payment updated:", formData)
    }
    setShowModal(false)
  }

  const handleDeletePayment = (paymentId: string) => {
    if (confirm("Are you sure you want to delete this payment?")) {
      setPayments(payments.filter(p => p.id !== paymentId))
      console.log("[v0] Payment deleted:", paymentId)
    }
  }

  const handleExportPayments = () => {
    const data = {
      exportDate: new Date().toISOString(),
      totalPayments: payments.length,
      payments: payments
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payments-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
    console.log("[v0] Payments exported successfully")
  }

  const handleProcessPayment = (paymentId: string) => {
    setPayments(payments.map(p => 
      p.id === paymentId ? { ...p, status: "Processing" } : p
    ))
    console.log("[v0] Payment processing started:", paymentId)
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Payment Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Process and manage all payment transactions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportPayments} variant="outline" className="bg-transparent gap-2">
            <Download size={18} />
            Export
          </Button>
          <Button onClick={handleAddPayment} className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Plus size={18} />
            New Payment
          </Button>
        </div>
      </div>

      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {paymentStats.map((stat, idx) => (
          <Card key={idx} className="p-6">
            <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">{stat.change}</p>
          </Card>
        ))}
      </div>

      {/* Search and Filter */}
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
        <Button
          variant="outline"
          className="bg-transparent gap-2"
          onClick={() => setShowPendingOnly((prev) => !prev)}
        >
          <Filter size={18} />
          {showPendingOnly ? "All" : "Pending"}
        </Button>
      </div>

      {/* Payments Table */}
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
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPayments.map(payment => (
                <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{payment.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{payment.recipient}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{payment.amount}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{payment.method}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      payment.status === "Completed" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                      payment.status === "Processing" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                      "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button
                      onClick={() => handleViewPayment(payment)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                      <Eye size={18} />
                    </button>
                    {payment.status === "Pending" && (
                      <button
                        onClick={() => handleProcessPayment(payment.id)}
                        className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                      >
                        <Send size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => handleEditPayment(payment)}
                      className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeletePayment(payment.id)}
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

      {/* Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {modalMode === "add" ? "Create Payment" : modalMode === "edit" ? "Edit Payment" : "View Payment"}
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
                  <label className="text-sm text-gray-600 dark:text-gray-400">Recipient</label>
                  <input
                    type="text"
                    value={formData.recipient}
                    onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
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
                  <label className="text-sm text-gray-600 dark:text-gray-400">Payment Method</label>
                  <select
                    value={formData.method}
                    onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                    disabled={modalMode === "view"}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option>Bank Transfer</option>
                    <option>M-Pesa</option>
                    <option>Airtel Money</option>
                    <option>Internal Transfer</option>
                  </select>
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
                    <option>Processing</option>
                    <option>Completed</option>
                    <option>Failed</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={modalMode === "view"}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Reference</label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    disabled={modalMode === "view"}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                {modalMode !== "view" && (
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleSavePayment}>
                    Save Payment
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
