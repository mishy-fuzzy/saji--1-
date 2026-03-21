"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Calendar, Download, DollarSign, Eye } from "lucide-react"

export default function AgentCommissionsPage() {
  const [selectedMonth, setSelectedMonth] = useState("January")
  
  const commissions = [
    { id: 1, month: "January", earned: "KES 45,500", cases: 127, rate: "3.5%", status: "Paid", date: "Jan 31" },
    { id: 2, month: "December", earned: "KES 38,200", cases: 108, rate: "3.5%", status: "Paid", date: "Dec 31" },
    { id: 3, month: "November", earned: "KES 42,100", cases: 119, rate: "3.5%", status: "Paid", date: "Nov 30" },
    { id: 4, month: "October", earned: "KES 35,800", cases: 101, rate: "3.5%", status: "Paid", date: "Oct 31" },
  ]

  const earningsBreakdown = [
    { category: "Dispute Resolution", amount: "KES 28,350", percentage: 62 },
    { category: "Query Handling", amount: "KES 14,175", percentage: 31 },
    { category: "Bonus Incentive", amount: "KES 2,975", percentage: 7 },
  ]

  const handleExportCommission = () => {
    const data = {
      exportDate: new Date().toISOString(),
      agentId: "AGT-001",
      commissions: commissions,
      breakdown: earningsBreakdown,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `commissions-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Commissions & Earnings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Track your commission history and earnings breakdown</p>
        </div>
        <Button onClick={handleExportCommission} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Download size={18} />
          Export History
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">This Month Earned</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">KES 45,500</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">+12% from last month</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Total YTD</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">KES 441,600</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">12 months cumulative</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Avg Commission Rate</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">3.5%</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Based on performance</p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Commission History */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Commission History</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Month</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Cases Handled</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Commission Rate</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Amount Earned</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {commissions.map(commission => (
                <tr key={commission.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{commission.month}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{commission.cases}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{commission.rate}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{commission.earned}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                      {commission.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{commission.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Earnings Breakdown */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">January Earnings Breakdown</h2>
        <div className="space-y-4">
          {earningsBreakdown.map((item, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-700 dark:text-gray-300 font-medium">{item.category}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.amount}</p>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-blue-400 h-2 rounded-full transition-all"
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.percentage}% of total</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
