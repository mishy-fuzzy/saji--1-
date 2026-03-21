"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, TrendingUp, Clock, Star, DollarSign } from "lucide-react"
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell
} from "recharts"

const monthlyPerformance = [
  { month: "Sep", cases: 85, resolved: 78, satisfaction: 91 },
  { month: "Oct", cases: 97, resolved: 90, satisfaction: 93 },
  { month: "Nov", cases: 108, resolved: 101, satisfaction: 92 },
  { month: "Dec", cases: 115, resolved: 110, satisfaction: 95 },
  { month: "Jan", cases: 122, resolved: 117, satisfaction: 94 },
  { month: "Feb", cases: 127, resolved: 122, satisfaction: 96 },
]

const weeklyResolution = [
  { day: "Mon", resolved: 6, pending: 2, avgTime: 2.1 },
  { day: "Tue", resolved: 8, pending: 1, avgTime: 1.8 },
  { day: "Wed", resolved: 5, pending: 3, avgTime: 2.5 },
  { day: "Thu", resolved: 7, pending: 2, avgTime: 2.0 },
  { day: "Fri", resolved: 9, pending: 1, avgTime: 1.6 },
  { day: "Sat", resolved: 3, pending: 1, avgTime: 3.2 },
  { day: "Sun", resolved: 2, pending: 0, avgTime: 2.8 },
]

const earningsData = [
  { month: "Sep", earnings: 32000, bonus: 5000 },
  { month: "Oct", earnings: 35200, bonus: 6200 },
  { month: "Nov", earnings: 38800, bonus: 7100 },
  { month: "Dec", earnings: 40100, bonus: 8500 },
  { month: "Jan", earnings: 42500, bonus: 9000 },
  { month: "Feb", earnings: 45500, bonus: 10200 },
]

const disputeCategories = [
  { name: "Payment", value: 42, color: "#3b82f6" },
  { name: "Quality", value: 28, color: "#f59e0b" },
  { name: "Delay", value: 18, color: "#10b981" },
  { name: "Fraud", value: 8, color: "#ef4444" },
  { name: "Other", value: 4, color: "#8b5cf6" },
]

const agentComparison = [
  { name: "You", cases: 127, rating: 4.8, earnings: 45500 },
  { name: "Sarah", cases: 118, rating: 4.7, earnings: 42100 },
  { name: "David", cases: 105, rating: 4.6, earnings: 38800 },
  { name: "Grace", cases: 98, rating: 4.5, earnings: 35200 },
  { name: "Tom", cases: 87, rating: 4.4, earnings: 31500 },
]

export default function AgentAnalyticsPage() {
  const [dateRange, setDateRange] = useState("month")

  const handleExport = () => {
    const data = {
      exportDate: new Date().toISOString(),
      period: dateRange,
      monthlyPerformance,
      earningsData,
      disputeCategories,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `agent-analytics-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Agent Analytics</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Detailed performance metrics and insights</p>
        </div>
        <div className="flex gap-2">
          {["week", "month", "quarter"].map((range) => (
            <Button
              key={range}
              onClick={() => setDateRange(range)}
              variant={dateRange === range ? "default" : "outline"}
              size="sm"
              className={dateRange === range ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-transparent"}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
          <Button onClick={handleExport} variant="outline" className="bg-transparent gap-2" size="sm">
            <Download size={16} /> Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: TrendingUp, label: "Total Cases", value: "127", sub: "+12% this month", color: "text-blue-600" },
          { icon: Clock, label: "Avg Resolution", value: "2.3h", sub: "-0.5h improvement", color: "text-amber-600" },
          { icon: Star, label: "Satisfaction", value: "96%", sub: "+2% growth", color: "text-emerald-600" },
          { icon: DollarSign, label: "Earnings", value: "KES 45.5K", sub: "+18% this period", color: "text-indigo-600" },
        ].map((s, i) => (
          <Card key={i} className="p-4 border-0 shadow-sm">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{s.value}</p>
            <p className="text-[10px] text-gray-400">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* Performance Trend - Area Chart */}
      <Card className="p-4 lg:p-5 border-0 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Performance Trend (6 months)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={monthlyPerformance}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
            />
            <Area type="monotone" dataKey="cases" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} name="Total Cases" />
            <Area type="monotone" dataKey="resolved" stroke="#10b981" fill="#10b981" fillOpacity={0.1} name="Resolved" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Weekly Resolution - Bar Chart */}
        <Card className="p-4 lg:p-5 border-0 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Weekly Resolution</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklyResolution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
              />
              <Bar dataKey="resolved" fill="#6366f1" radius={[6, 6, 0, 0]} name="Resolved" />
              <Bar dataKey="pending" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Dispute Categories - Pie Chart */}
        <Card className="p-4 lg:p-5 border-0 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Dispute Categories</h2>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={disputeCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {disputeCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap sm:flex-col gap-2">
              {disputeCategories.map((cat) => (
                <div key={cat.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-gray-600 dark:text-gray-400">{cat.name}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{cat.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Earnings Trend - Line Chart */}
      <Card className="p-4 lg:p-5 border-0 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Earnings Trend</h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={earningsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
              formatter={(value: number) => [`KES ${value.toLocaleString()}`, ""]}
            />
            <Line type="monotone" dataKey="earnings" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} name="Base Earnings" />
            <Line type="monotone" dataKey="bonus" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Bonus" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Agent Comparison - Horizontal Bar */}
      <Card className="p-4 lg:p-5 border-0 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Agent Comparison</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={agentComparison} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" stroke="#9ca3af" fontSize={12} />
            <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={12} width={50} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
            />
            <Bar dataKey="cases" fill="#6366f1" radius={[0, 6, 6, 0]} name="Cases Handled" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
