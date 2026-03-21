"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, TrendingUp, BarChart3, ArrowUpRight, ArrowDownRight, Users, CreditCard, Shield, Activity } from "lucide-react"
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

const revenueData = [
  { month: "Aug", revenue: 1.2, users: 980, transactions: 4200 },
  { month: "Sep", revenue: 1.5, users: 1120, transactions: 5100 },
  { month: "Oct", revenue: 1.8, users: 1340, transactions: 6300 },
  { month: "Nov", revenue: 2.1, users: 1560, transactions: 7200 },
  { month: "Dec", revenue: 2.4, users: 1780, transactions: 8100 },
  { month: "Jan", revenue: 2.2, users: 1950, transactions: 7800 },
  { month: "Feb", revenue: 2.6, users: 2200, transactions: 8900 },
]

const userGrowthData = [
  { month: "Aug", providers: 320, shopkeepers: 410, customers: 250 },
  { month: "Sep", providers: 380, shopkeepers: 460, customers: 280 },
  { month: "Oct", providers: 440, shopkeepers: 520, customers: 380 },
  { month: "Nov", providers: 510, shopkeepers: 590, customers: 460 },
  { month: "Dec", providers: 580, shopkeepers: 650, customers: 550 },
  { month: "Jan", providers: 640, shopkeepers: 710, customers: 600 },
  { month: "Feb", providers: 720, shopkeepers: 790, customers: 690 },
]

const roleDistribution = [
  { name: "Providers", value: 720 },
  { name: "Shopkeepers", value: 790 },
  { name: "Customers", value: 690 },
  { name: "Agents", value: 45 },
  { name: "Sub-Admins", value: 12 },
]

const weeklyActivity = [
  { day: "Mon", agents: 120, cases: 342, volume: 450 },
  { day: "Tue", agents: 125, cases: 356, volume: 482 },
  { day: "Wed", agents: 128, cases: 378, volume: 510 },
  { day: "Thu", agents: 132, cases: 395, volume: 534 },
  { day: "Fri", agents: 135, cases: 412, volume: 558 },
  { day: "Sat", agents: 110, cases: 280, volume: 390 },
  { day: "Sun", agents: 85, cases: 195, volume: 280 },
]

const COLORS = ["#2563eb", "#0891b2", "#10b981", "#f59e0b", "#6366f1"]

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<"week" | "month" | "quarter">("month")

  const metrics = [
    { label: "Total Users", value: "2,257", change: "+12%", up: true, icon: Users },
    { label: "Revenue (MTD)", value: "KES 2.6B", change: "+18%", up: true, icon: CreditCard },
    { label: "System Uptime", value: "99.9%", change: "Stable", up: true, icon: Activity },
    { label: "Active Agents", value: "142", change: "+8%", up: true, icon: Shield },
  ]

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">System Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Real-time platform performance and user metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
            {(["week", "month", "quarter"] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${period === p ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400"}`}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5 text-xs"><Download size={14} />Export</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600"><m.icon size={16} /></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{m.label}</p>
            <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{m.value}</p>
            <div className="flex items-center gap-1 mt-1">
              {m.change.includes("+") && <ArrowUpRight size={14} className="text-emerald-600" />}
              <span className={`text-xs font-medium ${m.change.includes("+") ? "text-emerald-600" : "text-gray-500"}`}>{m.change}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Revenue Trend */}
      <Card className="p-4 lg:p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Platform Revenue</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Monthly revenue trend (in Billions KES)</p>
        <div className="h-64 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="adminRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid #e5e7eb" }} />
              <Area type="monotone" dataKey="revenue" name="Revenue (B)" stroke="#2563eb" strokeWidth={2.5} fill="url(#adminRevGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* User Growth Stacked Area */}
        <Card className="p-4 lg:p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">User Growth by Role</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                <Area type="monotone" dataKey="providers" name="Providers" stackId="1" stroke="#2563eb" fill="#2563eb" fillOpacity={0.6} />
                <Area type="monotone" dataKey="shopkeepers" name="Shopkeepers" stackId="1" stroke="#0891b2" fill="#0891b2" fillOpacity={0.6} />
                <Area type="monotone" dataKey="customers" name="Customers" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Role Distribution Pie */}
        <Card className="p-4 lg:p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">User Distribution</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roleDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                  {roleDistribution.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(val: number, name: string) => [val.toLocaleString(), name]} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {roleDistribution.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-gray-600 dark:text-gray-400">{r.name}</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">{r.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Weekly Activity */}
      <Card className="p-4 lg:p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} className="text-gray-500" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Weekly Activity</h2>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="cases" name="Cases Handled" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="volume" name="Volume (K)" fill="#0891b2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Top Performers */}
      <Card className="p-4 lg:p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Top Performing Agents</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-400 text-xs">Rank</th>
                <th className="text-left py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-400 text-xs">Agent</th>
                <th className="text-right py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-400 text-xs">Cases</th>
                <th className="text-right py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-400 text-xs">Rating</th>
                <th className="text-right py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-400 text-xs hidden sm:table-cell">Satisfaction</th>
                <th className="text-right py-2.5 px-3 font-semibold text-gray-600 dark:text-gray-400 text-xs">Commission</th>
              </tr>
            </thead>
            <tbody>
              {[
                { rank: 1, name: "Kevin Otieno", cases: 98, rating: 4.9, satisfaction: 98, commission: "KES 59,500" },
                { rank: 2, name: "Grace Wairimu", cases: 87, rating: 4.8, satisfaction: 96, commission: "KES 52,200" },
                { rank: 3, name: "Daniel Ouma", cases: 79, rating: 4.7, satisfaction: 94, commission: "KES 47,100" },
                { rank: 4, name: "Faith Njeri", cases: 72, rating: 4.6, satisfaction: 92, commission: "KES 43,200" },
                { rank: 5, name: "Brian Kibet", cases: 68, rating: 4.5, satisfaction: 91, commission: "KES 40,800" },
              ].map(p => (
                <tr key={p.rank} className="border-b border-gray-100 dark:border-gray-700/50">
                  <td className="py-2.5 px-3"><span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${p.rank <= 3 ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>{p.rank}</span></td>
                  <td className="py-2.5 px-3 font-medium text-gray-900 dark:text-white">{p.name}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700 dark:text-gray-300">{p.cases}</td>
                  <td className="py-2.5 px-3 text-right text-amber-600 font-medium">{p.rating}</td>
                  <td className="py-2.5 px-3 text-right text-emerald-600 hidden sm:table-cell">{p.satisfaction}%</td>
                  <td className="py-2.5 px-3 text-right font-medium text-gray-900 dark:text-white">{p.commission}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
