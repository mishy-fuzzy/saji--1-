"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

const revenueData = [
  { month: "Sep", revenue: 1.8, expenses: 0.45 },
  { month: "Oct", revenue: 2.1, expenses: 0.52 },
  { month: "Nov", revenue: 1.9, expenses: 0.48 },
  { month: "Dec", revenue: 2.5, expenses: 0.61 },
  { month: "Jan", revenue: 2.3, expenses: 0.55 },
  { month: "Feb", revenue: 2.45, expenses: 0.58 },
]

const channelData = [
  { name: "Bank Transfer", value: 48, amount: "1.176B" },
  { name: "M-Pesa", value: 35, amount: "857.5M" },
  { name: "Cheque", value: 12, amount: "294M" },
  { name: "Other", value: 5, amount: "122.5M" },
]

const weeklyData = [
  { day: "Mon", transactions: 1420, volume: 278 },
  { day: "Tue", transactions: 1540, volume: 301 },
  { day: "Wed", transactions: 1680, volume: 328 },
  { day: "Thu", transactions: 1750, volume: 342 },
  { day: "Fri", transactions: 1920, volume: 375 },
  { day: "Sat", transactions: 980, volume: 191 },
  { day: "Sun", transactions: 620, volume: 121 },
]

const COLORS = ["#2563eb", "#0891b2", "#6366f1", "#a3a3a3"]

export default function SecretaryAnalyticsPage() {
  const [period, setPeriod] = useState<"week" | "month" | "quarter">("month")

  const handleExportAnalytics = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      period,
      revenueData,
      channelData,
      weeklyData,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `secretary-analytics-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const metrics = [
    { label: "Total Transactions", value: "12,450", change: "+8%", up: true },
    { label: "Transaction Volume", value: "KES 2.45B", change: "+18%", up: true },
    { label: "Avg Transaction", value: "KES 196,800", change: "+5%", up: true },
    { label: "Success Rate", value: "99.7%", change: "Stable", up: true },
  ]

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Financial Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Comprehensive transaction and payment analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
            {(["week", "month", "quarter"] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${period === p ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400"}`}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5 text-xs" onClick={handleExportAnalytics}>
            <Download size={14} />
            Export
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m, i) => (
          <Card key={i} className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{m.label}</p>
            <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{m.value}</p>
            <div className="flex items-center gap-1 mt-1.5">
              {m.change.includes("+") ? <ArrowUpRight size={14} className="text-emerald-600" /> : null}
              <span className={`text-xs font-medium ${m.change.includes("+") ? "text-emerald-600" : "text-gray-500"}`}>{m.change}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Revenue Trend Chart */}
      <Card className="p-4 lg:p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Revenue vs Expenses</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Monthly financial overview (in Billions KES)</p>
        <div className="h-64 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="secRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="secExpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid #e5e7eb" }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
              <Area type="monotone" dataKey="revenue" name="Revenue (B)" stroke="#2563eb" strokeWidth={2} fill="url(#secRevGrad)" />
              <Area type="monotone" dataKey="expenses" name="Expenses (B)" stroke="#f59e0b" strokeWidth={2} fill="url(#secExpGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payment Channel Donut */}
        <Card className="p-4 lg:p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Payment Channels</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={channelData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                  {channelData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: number, name: string) => [`${val}%`, name]} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {channelData.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-gray-700 dark:text-gray-300">{c.name}</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">KES {c.amount}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Weekly Transactions Bar Chart */}
        <Card className="p-4 lg:p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Weekly Transactions</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="transactions" name="Transactions" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="volume" name="Volume (M)" fill="#0891b2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Top Accounts Table */}
      <Card className="p-4 lg:p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Top Transacting Accounts</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-400 text-xs">Account</th>
                <th className="text-left py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-400 text-xs">Type</th>
                <th className="text-right py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-400 text-xs">Volume</th>
                <th className="text-right py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-400 text-xs">Trend</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Nairobi Fresh Mart", type: "Shopkeeper", vol: "KES 12.5M", trend: "+24%" },
                { name: "James Mwangi", type: "Provider", vol: "KES 8.2M", trend: "+18%" },
                { name: "Westlands Hardware", type: "Shopkeeper", vol: "KES 6.8M", trend: "+12%" },
                { name: "Sarah Odhiambo", type: "Provider", vol: "KES 5.1M", trend: "+9%" },
                { name: "CBD Electronics", type: "Shopkeeper", vol: "KES 4.7M", trend: "+15%" },
              ].map((row, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50">
                  <td className="py-2.5 px-3 font-medium text-gray-900 dark:text-white">{row.name}</td>
                  <td className="py-2.5 px-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.type === "Shopkeeper" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"}`}>{row.type}</span></td>
                  <td className="py-2.5 px-3 text-right font-medium text-gray-900 dark:text-white">{row.vol}</td>
                  <td className="py-2.5 px-3 text-right"><span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center justify-end gap-0.5"><ArrowUpRight size={12} />{row.trend}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
