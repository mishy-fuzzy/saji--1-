"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, TrendingUp, Users, Briefcase, ShieldCheck } from "lucide-react"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"

const monthlyData = [
  { month: "Sep", users: 820, jobs: 180, verifications: 45 },
  { month: "Oct", users: 910, jobs: 210, verifications: 52 },
  { month: "Nov", users: 1020, jobs: 265, verifications: 68 },
  { month: "Dec", users: 1100, jobs: 290, verifications: 74 },
  { month: "Jan", users: 1180, jobs: 320, verifications: 82 },
  { month: "Feb", users: 1238, jobs: 342, verifications: 91 },
]

const dailyActivity = [
  { day: "Mon", logins: 340, actions: 120 },
  { day: "Tue", logins: 380, actions: 145 },
  { day: "Wed", logins: 420, actions: 160 },
  { day: "Thu", logins: 390, actions: 138 },
  { day: "Fri", logins: 450, actions: 175 },
  { day: "Sat", logins: 280, actions: 90 },
  { day: "Sun", logins: 210, actions: 65 },
]

export default function SubAdminAnalyticsPage() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Platform growth and engagement metrics</p>
        </div>
        <Button variant="outline" className="bg-transparent gap-2 text-sm"><Download size={16} /> Export</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Users, label: "User Growth", value: "+12.5%", sub: "vs last month", color: "text-blue-600" },
          { icon: Briefcase, label: "Job Growth", value: "+8.2%", sub: "vs last month", color: "text-amber-600" },
          { icon: ShieldCheck, label: "Verification Rate", value: "87%", sub: "of submissions", color: "text-emerald-600" },
          { icon: TrendingUp, label: "Engagement", value: "4.2min", sub: "avg session", color: "text-violet-600" },
        ].map((s,i) => (
          <Card key={i} className="p-4 border-0 shadow-sm">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{s.value}</p>
            <p className="text-[10px] text-gray-400">{s.sub}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4 lg:p-5 border-0 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Platform Growth (6 months)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }} />
            <Area type="monotone" dataKey="users" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} name="Total Users" />
            <Area type="monotone" dataKey="jobs" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} name="Active Jobs" />
            <Area type="monotone" dataKey="verifications" stroke="#10b981" fill="#10b981" fillOpacity={0.1} name="Verifications" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-4 lg:p-5 border-0 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Weekly User Activity</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={dailyActivity}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }} />
            <Bar dataKey="logins" fill="#3b82f6" radius={[6,6,0,0]} name="Logins" />
            <Bar dataKey="actions" fill="#8b5cf6" radius={[6,6,0,0]} name="Actions" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
