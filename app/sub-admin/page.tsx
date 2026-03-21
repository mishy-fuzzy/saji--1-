"use client"

import { useState } from "react"
import { Users, Briefcase, TrendingUp, AlertCircle, CheckCircle, Clock, ArrowRight, Shield, Eye } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const weeklyData = [
  { day: "Mon", users: 12, verifications: 4 },
  { day: "Tue", users: 18, verifications: 6 },
  { day: "Wed", users: 15, verifications: 8 },
  { day: "Thu", users: 22, verifications: 5 },
  { day: "Fri", users: 19, verifications: 7 },
  { day: "Sat", users: 8, verifications: 3 },
  { day: "Sun", users: 5, verifications: 2 },
]

const roleData = [
  { name: "Customers", value: 580, color: "#3b82f6" },
  { name: "Providers", value: 420, color: "#10b981" },
  { name: "Shopkeepers", value: 180, color: "#f59e0b" },
  { name: "Agents", value: 58, color: "#8b5cf6" },
]

export default function SubAdminDashboard() {
  const stats = [
    { icon: Users, label: "Total Users", value: "1,238", change: "+12.5%", positive: true, color: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20", iconColor: "text-blue-600" },
    { icon: Briefcase, label: "Active Jobs", value: "342", change: "+8.2%", positive: true, color: "from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20", iconColor: "text-amber-600" },
    { icon: CheckCircle, label: "Verified Users", value: "864", change: "+23.1%", positive: true, color: "from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20", iconColor: "text-emerald-600" },
    { icon: AlertCircle, label: "Pending Approvals", value: "18", change: "-3", positive: false, color: "from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20", iconColor: "text-red-600" },
  ]

  const pendingActions = [
    { id: 1, type: "verification", title: "Sarah K. -- ID Verification", time: "2h ago", urgency: "high" },
    { id: 2, type: "report", title: "Flagged content from Provider #234", time: "4h ago", urgency: "medium" },
    { id: 3, type: "user", title: "New shopkeeper registration -- Alice T.", time: "6h ago", urgency: "low" },
    { id: 4, type: "verification", title: "Martin M. -- License Verification", time: "8h ago", urgency: "high" },
    { id: 5, type: "user", title: "Account reactivation request -- Bob W.", time: "1d ago", urgency: "low" },
  ]

  const recentActivity = [
    { action: "Approved verification", user: "John M.", time: "10 min ago", type: "success" },
    { action: "Suspended account", user: "Spam User #12", time: "1h ago", type: "warning" },
    { action: "Resolved dispute", user: "Case DSP-042", time: "3h ago", type: "success" },
    { action: "Rejected verification", user: "Fake ID submission", time: "5h ago", type: "error" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Sub-Admin Dashboard</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Overview of platform management activities</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-sm">Generate Report</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {stats.map((s, i) => (
          <Card key={i} className={`p-4 lg:p-5 border-0 shadow-sm bg-gradient-to-br ${s.color}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-white/60 dark:bg-gray-700/50">
                <s.icon className={`w-5 h-5 ${s.iconColor}`} />
              </div>
              <span className={`text-xs font-semibold ${s.positive ? "text-emerald-600" : "text-red-600"}`}>
                {s.change}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">{s.label}</p>
            <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mt-1">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-4 lg:p-5 border-0 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Weekly Registrations & Verifications</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }} />
              <Bar dataKey="users" fill="#3b82f6" radius={[6, 6, 0, 0]} name="New Users" />
              <Bar dataKey="verifications" fill="#10b981" radius={[6, 6, 0, 0]} name="Verifications" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4 lg:p-5 border-0 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">User Role Distribution</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={roleData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value">
                {roleData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {roleData.map((r) => (
              <div key={r.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                  <span className="text-gray-600 dark:text-gray-300">{r.name}</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">{r.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Pending + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 lg:p-5 border-0 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Pending Actions</h2>
            <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 px-2 py-0.5 rounded-full font-medium">{pendingActions.length}</span>
          </div>
          <div className="space-y-2">
            {pendingActions.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.urgency === "high" ? "bg-red-500" : a.urgency === "medium" ? "bg-amber-500" : "bg-blue-500"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{a.title}</p>
                  <p className="text-[10px] text-gray-500">{a.time}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 lg:p-5 border-0 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${a.type === "success" ? "bg-emerald-100 dark:bg-emerald-900/30" : a.type === "warning" ? "bg-amber-100 dark:bg-amber-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                  <CheckCircle className={`w-4 h-4 ${a.type === "success" ? "text-emerald-600" : a.type === "warning" ? "text-amber-600" : "text-red-600"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{a.action}</p>
                  <p className="text-xs text-gray-500">{a.user} -- {a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
