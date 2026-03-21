"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Download, Eye, Plus, X, Trash2 } from "lucide-react"

export default function InvoicingPage() {
  const [invoices, setInvoices] = useState([
    { id: "INV-001", client: "Provider ABC", amount: "KES 125,000", dueDate: "Jan 31", status: "Paid", date: "Jan 5" },
    { id: "INV-002", client: "Agent XYZ", amount: "KES 45,500", dueDate: "Feb 5", status: "Pending", date: "Jan 10" },
    { id: "INV-003", client: "Vendor Corp", amount: "KES 89,900", dueDate: "Jan 20", status: "Overdue", date: "Dec 25" },
  ])

  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ client: "", amount: "", dueDate: "", description: "" })

  const summaryData = [
    { label: "Total Invoiced", value: "KES 12,450,000", trend: "+8%" },
    { label: "Paid", value: "KES 11,890,000", trend: "+12%" },
    { label: "Pending", value: "KES 450,000", trend: "-5%" },
    { label: "Overdue", value: "KES 110,000", trend: "+2%" },
  ]

  const handleCreateInvoice = () => {
    if (formData.client && formData.amount && formData.dueDate) {
      const newInvoice = {
        id: `INV-${String(invoices.length + 1).padStart(3, "0")}`,
        client: formData.client,
        amount: `KES ${parseInt(formData.amount).toLocaleString()}`,
        dueDate: formData.dueDate,
        status: "Pending",
        date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
      }
      setInvoices([newInvoice, ...invoices])
      setFormData({ client: "", amount: "", dueDate: "", description: "" })
      setShowModal(false)
      console.log("[v0] Invoice created:", newInvoice)
    }
  }

  const handleDeleteInvoice = (invoiceId: string) => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      setInvoices(invoices.filter(inv => inv.id !== invoiceId))
      console.log("[v0] Invoice deleted:", invoiceId)
    }
  }

  const handleExportInvoices = () => {
    const data = {
      exportDate: new Date().toISOString(),
      totalInvoices: invoices.length,
      invoices: invoices,
      summary: summaryData
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoices-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
    console.log("[v0] Invoices exported successfully")
  }

  const handleViewInvoice = (invoice: any) => {
    alert(`Invoice ${invoice.id}\nClient: ${invoice.client}\nAmount: ${invoice.amount}\nStatus: ${invoice.status}`)
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Invoicing & Billing</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage invoices, track payments, and billing history</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportInvoices} variant="outline" className="bg-transparent gap-2">
            <Download size={18} />
            Export
          </Button>
          <Button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Plus size={18} />
            Create Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryData.map((item, idx) => (
          <Card key={idx} className="p-6">
            <p className="text-sm text-muted-foreground mb-2">{item.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">{item.trend}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Invoices ({invoices.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Invoice ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Client</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Due Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {invoices.map(invoice => (
                <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{invoice.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{invoice.client}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{invoice.amount}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      invoice.status === "Paid" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                      invoice.status === "Pending" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" :
                      "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{invoice.dueDate}</td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <button
                      onClick={() => handleViewInvoice(invoice)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteInvoice(invoice.id)}
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

      {/* Create Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Invoice</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Client Name</label>
                  <input
                    type="text"
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Amount (KES)</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleCreateInvoice}>
                  Create Invoice
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
