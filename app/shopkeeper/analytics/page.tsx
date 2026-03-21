"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { BarChart3, TrendingUp, TrendingDown, Users, DollarSign, Calendar, Download, FileText, Share2, ShoppingCart, Eye, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts"

const salesData = [
  { name: "Mon", revenue: 18500, orders: 12 },
  { name: "Tue", revenue: 24200, orders: 18 },
  { name: "Wed", revenue: 19800, orders: 14 },
  { name: "Thu", revenue: 31500, orders: 22 },
  { name: "Fri", revenue: 28700, orders: 20 },
  { name: "Sat", revenue: 42100, orders: 31 },
  { name: "Sun", revenue: 35400, orders: 25 },
]

const monthlySales = [
  { name: "Aug", revenue: 185000 },
  { name: "Sep", revenue: 210000 },
  { name: "Oct", revenue: 195000 },
  { name: "Nov", revenue: 240000 },
  { name: "Dec", revenue: 310000 },
  { name: "Jan", revenue: 285000 },
]

const categoryData = [
  { name: "Electronics", value: 45, color: "#d97706" },
  { name: "Appliances", value: 28, color: "#2563eb" },
  { name: "Hardware", value: 15, color: "#059669" },
  { name: "Furniture", value: 12, color: "#7c3aed" },
]

const trafficSources = [
  { name: "Direct", visitors: 1240 },
  { name: "Search", visitors: 890 },
  { name: "Social", visitors: 560 },
  { name: "Referral", visitors: 320 },
  { name: "Email", visitors: 190 },
]

const topProducts = [
  { name: "Samsung Smart TV 55\"", sales: 24, revenue: 1560000, growth: 12.5 },
  { name: "LG Side-by-Side Fridge", sales: 18, revenue: 1602000, growth: 8.2 },
  { name: "Sony Home Theater", sales: 15, revenue: 525000, growth: -3.1 },
  { name: "Bosch Washing Machine", sales: 12, revenue: 540000, growth: 22.4 },
  { name: "HP Laptop 15.6\"", sales: 8, revenue: 440000, growth: 5.7 },
]

export default function ShopkeeperAnalyticsPage() {
  const [dateRange, setDateRange] = useState("7d")
  const [showExportModal, setShowExportModal] = useState(false)

  const handleExportReport = (format: string) => {
    alert(`Exporting report as ${format.toUpperCase()}...`)
    setShowExportModal(false)
  }

  const kpis = [
    { label: "Total Revenue", value: "KES 2.45M", change: 12.5, trend: "up", icon: DollarSign, color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" },
    { label: "Total Orders", value: "156", change: 8.2, trend: "up", icon: ShoppingCart, color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" },
    { label: "Avg Order Value", value: "KES 15,700", change: 3.2, trend: "up", icon: BarChart3, color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" },
    { label: "Store Visitors", value: "3,200", change: -2.1, trend: "down", icon: Users, color: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400" },
  ]

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `KES ${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `KES ${(value / 1000).toFixed(0)}K`
    return `KES ${value.toLocaleString()}`
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Analytics & Reports</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track and analyze your shop performance</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5">
              <Calendar className="w-4 h-4 text-amber-600" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-transparent text-sm outline-none text-gray-700 dark:text-gray-200"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="year">This Year</option>
              </select>
            </div>
            <Button onClick={() => setShowExportModal(true)} className="bg-amber-600 hover:bg-amber-700 gap-2 text-sm h-9">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon
            const isUp = kpi.trend === "up"
            return (
              <Card key={idx} className="p-4 lg:p-5 border-0 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${kpi.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className={`flex items-center gap-0.5 text-xs font-semibold ${isUp ? "text-emerald-600" : "text-red-500"}`}>
                    {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(kpi.change)}%
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{kpi.label}</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{kpi.value}</p>
              </Card>
            )
          })}
        </div>

        {/* Charts Row 1: Revenue Trend + Category Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Revenue Trend - Area Chart */}
          <Card className="lg:col-span-2 p-4 lg:p-5 border-0 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Revenue Trend</h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">This Week</span>
            </div>
            <div className="h-64 lg:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    formatter={(value: number) => [`KES ${value.toLocaleString()}`, "Revenue"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#d97706" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Category Breakdown - Pie Chart */}
          <Card className="p-4 lg:p-5 border-0 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Sales by Category</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value}%`, "Share"]} contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {categoryData.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-gray-700 dark:text-gray-300">{cat.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{cat.value}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Charts Row 2: Monthly Revenue + Traffic Sources */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Monthly Revenue - Bar Chart */}
          <Card className="p-4 lg:p-5 border-0 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Monthly Revenue</h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">Last 6 Months</span>
            </div>
            <div className="h-56 lg:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySales} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    formatter={(value: number) => [`KES ${value.toLocaleString()}`, "Revenue"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: 12 }}
                  />
                  <Bar dataKey="revenue" fill="#d97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Traffic Sources - Horizontal Bar Chart */}
          <Card className="p-4 lg:p-5 border-0 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Traffic Sources</h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">This Month</span>
            </div>
            <div className="h-56 lg:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trafficSources} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="#9ca3af" width={55} />
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString(), "Visitors"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: 12 }}
                  />
                  <Bar dataKey="visitors" fill="#2563eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Top Products Table */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="p-4 lg:p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Top Performing Products</h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">Sorted by revenue</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left px-4 lg:px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                  <th className="text-left px-4 lg:px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="text-left px-4 lg:px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Units Sold</th>
                  <th className="text-left px-4 lg:px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Revenue</th>
                  <th className="text-left px-4 lg:px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Growth</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product, idx) => (
                  <tr key={idx} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 lg:px-5 py-3">
                      <span className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-4 lg:px-5 py-3 text-sm font-medium text-gray-900 dark:text-white">{product.name}</td>
                    <td className="px-4 lg:px-5 py-3 text-sm text-gray-600 dark:text-gray-400">{product.sales}</td>
                    <td className="px-4 lg:px-5 py-3 text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(product.revenue)}</td>
                    <td className="px-4 lg:px-5 py-3">
                      <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${product.growth > 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {product.growth > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(product.growth)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Export Modal */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Export Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {[
              { format: "pdf", label: "PDF Report", desc: "Formatted document with charts", color: "text-red-600" },
              { format: "excel", label: "Excel Spreadsheet", desc: "Raw data in spreadsheet", color: "text-emerald-600" },
              { format: "csv", label: "CSV File", desc: "Comma-separated values", color: "text-blue-600" },
            ].map((item) => (
              <button
                key={item.format}
                onClick={() => handleExportReport(item.format)}
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left flex items-center gap-3"
              >
                <FileText className={`w-5 h-5 ${item.color}`} />
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white">{item.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
