"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, DollarSign, Clock, CheckCircle, AlertCircle, Download } from "lucide-react"

export default function WithdrawalsPage() {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("bank")
  type Withdrawal = {
    id: string
    amount: string
    method: string
    status: "Completed" | "Processing" | "Pending"
    date: string
    referenceNo: string
  }
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])

  const availableBalance = "KES 0"
  const minimumWithdrawal = "KES 0"
  const maximumWithdrawal = "KES 0"

  const openWithdrawWithMethod = (method: "bank" | "mpesa") => {
    setPaymentMethod(method)
    setShowWithdrawModal(true)
  }

  const handleWithdraw = () => {
    if (withdrawAmount && paymentMethod) {
      const newWithdrawal = {
        id: `WTH-${String(withdrawals.length + 1).padStart(3, '0')}`,
        amount: `KES ${parseInt(withdrawAmount).toLocaleString()}`,
        method: paymentMethod === "bank" ? "Bank Transfer" : "M-Pesa",
        status: "Processing",
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        referenceNo: `REF-2025-${String(withdrawals.length + 1).padStart(3, '0')}`
      }
      setWithdrawals([newWithdrawal, ...withdrawals])
      setWithdrawAmount("")
      setShowWithdrawModal(false)
    }
  }

  const handleExportWithdrawals = () => {
    const data = {
      exportDate: new Date().toISOString(),
      availableBalance,
      withdrawals: withdrawals
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `withdrawals-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Commission Withdrawals</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your commission payouts and withdrawal history</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportWithdrawals} variant="outline" className="bg-transparent gap-2">
            <Download size={18} />
            Export
          </Button>
          <Button onClick={() => setShowWithdrawModal(true)} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            <DollarSign size={18} />
            Withdraw
          </Button>
        </div>
      </div>

      {/* Balance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Available Balance</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{availableBalance}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Ready to withdraw</p>
            </div>
            <div className="bg-emerald-200 dark:bg-emerald-700/50 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Minimum Withdrawal</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{minimumWithdrawal}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Per transaction</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Maximum Withdrawal</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{maximumWithdrawal}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Per transaction</p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Withdrawal Methods */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Available Withdrawal Methods</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            onClick={() => openWithdrawWithMethod("bank")}
            className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Bank Transfer</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">2-3 business days</p>
              </div>
            </div>
          </div>
          <div
            onClick={() => openWithdrawWithMethod("mpesa")}
            className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-yellow-500 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">M-Pesa</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Instant transfer</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Withdrawal History */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Withdrawal History</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Method</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {withdrawals.map(withdrawal => (
                <tr key={withdrawal.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{withdrawal.id}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{withdrawal.amount}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{withdrawal.method}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      {withdrawal.status === "Completed" && <CheckCircle className="w-4 h-4 text-green-600" />}
                      {withdrawal.status === "Processing" && <Clock className="w-4 h-4 text-yellow-600" />}
                      {withdrawal.status === "Pending" && <AlertCircle className="w-4 h-4 text-orange-600" />}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        withdrawal.status === "Completed" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                        withdrawal.status === "Processing" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" :
                        "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                      }`}>
                        {withdrawal.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{withdrawal.date}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{withdrawal.referenceNo}</td>
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No withdrawal history available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Request Withdrawal</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount (KES)</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Available: {availableBalance} | Min: {minimumWithdrawal} | Max: {maximumWithdrawal}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="bank">Bank Transfer</option>
                <option value="mpesa">M-Pesa</option>
              </select>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-300">
              Processing fee of 1% will be deducted from the withdrawal amount.
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 bg-transparent"
              >
                Cancel
              </Button>
              <Button
                onClick={handleWithdraw}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                Request Withdrawal
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
