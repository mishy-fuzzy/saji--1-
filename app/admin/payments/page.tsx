"use client"

import { useState } from "react"
import { Search, Download, Filter, Eye, DollarSign, TrendingUp, Clock, CreditCard, Wallet } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const paymentsData = [
  { id: "PM-001", user: "Sarah K.", job: "Web Development", amount: 150000, method: "Bank Transfer", status: "Completed", date: "Feb 05, 2026", fee: 4500 },
  { id: "PM-002", user: "John D.", job: "UI Design", amount: 75000, method: "Mobile Money", status: "Pending", date: "Feb 04, 2026", fee: 2250 },
  { id: "PM-003", user: "Alice T.", job: "Content Writing", amount: 50000, method: "Card", status: "Completed", date: "Feb 02, 2026", fee: 1500 },
  { id: "PM-004", user: "Mark L.", job: "SEO Services", amount: 40000, method: "Bank Transfer", status: "Failed", date: "Feb 01, 2026", fee: 1200 },
  { id: "PM-005", user: "Emma B.", job: "Logo Design", amount: 60000, method: "Mobile Money", status: "Completed", date: "Jan 31, 2026", fee: 1800 },
  { id: "PM-006", user: "Tom C.", job: "App Dev", amount: 200000, method: "Card", status: "Processing", date: "Jan 30, 2026", fee: 6000 },
]

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState("All")
  const [payments, setPayments] = useState(paymentsData)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)

  const filters = [
    { label: "All", type: "All", count: payments.length },
    { label: "Completed", type: "Completed", count: payments.filter(p => p.status === "Completed").length },
    { label: "Pending", type: "Pending", count: payments.filter(p => p.status === "Pending").length },
    { label: "Processing", type: "Processing", count: payments.filter(p => p.status === "Processing").length },
    { label: "Failed", type: "Failed", count: payments.filter(p => p.status === "Failed").length },
  ]

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.user.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.includes(searchTerm.toUpperCase())
    const matchesFilter = activeFilter === "All" || p.status === activeFilter
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch(status) {
      case "Completed": return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
      case "Pending": return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
      case "Processing": return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
      case "Failed": return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
      default: return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
    }
  }

  const handleExportPayments = () => {
    const data = {
      exportDate: new Date().toISOString(),
      totalPayments: payments.length,
      payments: payments.map(p => ({
        id: p.id,
        user: p.user,
        job: p.job,
        amount: p.amount,
        method: p.method,
        status: p.status,
        fee: p.fee,
        date: p.date,
      }))
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payments-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleRetryPayment = (paymentId: string) => {
    setPayments(payments.map(p => 
      p.id === paymentId 
        ? { ...p, status: p.status === "Failed" ? "Processing" : p.status }
        : p
    ))
    setShowModal(false)
  }

  const handleViewReceipt = (payment: any) => {
    const receiptData = {
      receiptNumber: `RCP-${Date.now()}`,
      paymentId: payment.id,
      user: payment.user,
      job: payment.job,
      amount: payment.amount,
      fee: payment.fee,
      netAmount: payment.amount - payment.fee,
      method: payment.method,
      status: payment.status,
      date: new Date().toLocaleString(),
    }
    const blob = new Blob([JSON.stringify(receiptData, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `receipt-${payment.id}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const stats = [
    { label: "Total Transactions", value: payments.length, icon: CreditCard, color: "from-blue-50 to-blue-100" },
    { label: "Completed", value: payments.filter(p => p.status === "Completed").length, icon: TrendingUp, color: "from-emerald-50 to-emerald-100" },
    { label: "Pending", value: payments.filter(p => p.status === "Pending" || p.status === "Processing").length, icon: Clock, color: "from-yellow-50 to-yellow-100" },
    { label: "Total Processed", value: `KES ${(payments.reduce((sum, p) => sum + p.amount, 0) / 1000).toFixed(0)}K`, icon: Wallet, color: "from-purple-50 to-purple-100" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Payments Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor and manage all platform transactions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <Card key={i} className={`p-4 border-0 shadow-lg bg-gradient-to-br ${stat.color} dark:from-gray-800 dark:to-gray-800`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                </div>
                <Icon className="w-5 h-5 text-gray-400" />
              </div>
            </Card>
          )
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="w-full sm:flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <Button 
          onClick={handleExportPayments}
          className="bg-green-600 hover:bg-green-700 gap-2"
        >
          <Download size={18} />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filters.map((filter) => (
          <button
            key={filter.type}
            onClick={() => setActiveFilter(filter.type)}
            className={`px-4 py-2 whitespace-nowrap rounded-lg font-medium transition-colors flex items-center gap-2 text-sm ${
              activeFilter === filter.type
                ? "bg-blue-600 text-white shadow-lg"
                : "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            {filter.label}
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-200 dark:bg-gray-700">{filter.count}</span>
          </button>
        ))}
      </div>

      {/* Payments Table */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Job</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Method</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{payment.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{payment.user}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{payment.job}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">KES {payment.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{payment.method}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => { setSelectedPayment(payment); setShowModal(true); }}
                      className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-blue-600"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">ID:</span>
                  <span className="font-semibold">{selectedPayment.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">User:</span>
                  <span className="font-semibold">{selectedPayment.user}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount:</span>
                  <span className="font-semibold">KES {selectedPayment.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Platform Fee:</span>
                  <span className="font-semibold">KES {selectedPayment.fee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Method:</span>
                  <span className="font-semibold">{selectedPayment.method}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 bg-transparent"
                  onClick={() => handleViewReceipt(selectedPayment)}
                >
                  View Receipt
                </Button>
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleRetryPayment(selectedPayment.id)}
                >
                  Retry
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
