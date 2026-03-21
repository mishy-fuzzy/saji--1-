"use client"

import { useState } from "react"
import { TrendingUp, TrendingDown, DollarSign, Users, Briefcase, Star, Eye, Clock, Calendar, ArrowUpRight, ArrowDownRight, BarChart3, PieChart as PieChartIcon } from "lucide-react"
import { Card } from "@/components/ui/card"

type Period = "7d" | "30d" | "90d" | "12m"

const earningsData = {
  "7d": [3200, 4100, 2800, 5500, 3900, 4800, 3100],
  "30d": [12000, 15000, 11000, 18000, 14000, 16000, 19000, 13000, 17000, 20000, 15000, 18000, 22000, 14000, 16000, 21000, 18000, 15000, 19000, 23000, 17000, 20000, 16000, 14000, 18000, 21000, 24000, 19000, 22000, 17000],
  "90d": Array.from({ length: 12 }, () => Math.floor(Math.random() * 80000) + 40000),
  "12m": [120000, 135000, 148000, 162000, 155000, 178000, 185000, 192000, 201000, 188000, 215000, 230000],
}

const jobsByCategory = [
  { name: "Plumbing", count: 45, pct: 38, color: "bg-primary" },
  { name: "Electrical", count: 28, pct: 24, color: "bg-accent" },
  { name: "Carpentry", count: 18, pct: 15, color: "bg-amber-500" },
  { name: "Painting", count: 15, pct: 13, color: "bg-emerald-500" },
  { name: "Other", count: 12, pct: 10, color: "bg-muted-foreground" },
]

const peakHours = [
  { hour: "6-8am", jobs: 5 }, { hour: "8-10am", jobs: 18 }, { hour: "10-12pm", jobs: 22 },
  { hour: "12-2pm", jobs: 12 }, { hour: "2-4pm", jobs: 20 }, { hour: "4-6pm", jobs: 16 },
  { hour: "6-8pm", jobs: 8 }, { hour: "8-10pm", jobs: 3 },
]

const topCustomers = [
  { name: "Sarah Wanjiku", jobs: 8, spent: 68000, lastJob: "2 days ago" },
  { name: "John Kamau", jobs: 6, spent: 52000, lastJob: "1 week ago" },
  { name: "Grace Muthoni", jobs: 5, spent: 43000, lastJob: "3 days ago" },
  { name: "Peter Odhiambo", jobs: 4, spent: 38000, lastJob: "5 days ago" },
  { name: "Mary Njeri", jobs: 4, spent: 31000, lastJob: "2 weeks ago" },
]

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30d")

  const data = earningsData[period]
  const total = data.reduce((a, b) => a + b, 0)
  const maxVal = Math.max(...data)
  const prevTotal = total * 0.85
  const growth = ((total - prevTotal) / prevTotal * 100).toFixed(1)
  const isPositive = Number(growth) >= 0

  const peakMax = Math.max(...peakHours.map(h => h.jobs))

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics & Insights</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your performance and earnings trends</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {(["7d", "30d", "90d", "12m"] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : p === "90d" ? "90 Days" : "12 Months"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Revenue", value: `KES ${(total / 1000).toFixed(0)}K`, change: `+${growth}%`, icon: DollarSign, positive: true },
          { label: "Jobs Completed", value: "118", change: "+12%", icon: Briefcase, positive: true },
          { label: "Avg Rating", value: "4.8", change: "+0.1", icon: Star, positive: true },
          { label: "Repeat Clients", value: "34%", change: "-2%", icon: Users, positive: false },
        ].map((kpi, i) => (
          <Card key={i} className="p-4 border border-border rounded-xl">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 rounded-lg bg-primary/10"><kpi.icon className="w-4 h-4 text-primary" /></div>
              <span className={`text-[11px] font-medium flex items-center gap-0.5 ${kpi.positive ? "text-emerald-600" : "text-destructive"}`}>
                {kpi.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {kpi.change}
              </span>
            </div>
            <p className="text-xl font-bold text-foreground">{kpi.value}</p>
            <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      <Card className="p-4 border border-border rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" />Revenue Trend</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Earnings over selected period</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-foreground">KES {total.toLocaleString()}</p>
            <p className={`text-xs font-medium ${isPositive ? "text-emerald-600" : "text-destructive"}`}>
              {isPositive ? "+" : ""}{growth}% vs previous
            </p>
          </div>
        </div>
        <div className="flex items-end gap-1 h-40">
          {data.map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-primary/80 rounded-t-sm hover:bg-primary transition-colors min-h-[2px]"
                style={{ height: `${(val / maxVal) * 100}%` }}
                title={`KES ${val.toLocaleString()}`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-muted-foreground">Start</span>
          <span className="text-[10px] text-muted-foreground">End</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Jobs by Category */}
        <Card className="p-4 border border-border rounded-xl">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4"><PieChartIcon className="w-4 h-4 text-primary" />Jobs by Category</h3>
          <div className="space-y-3">
            {jobsByCategory.map(cat => (
              <div key={cat.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground font-medium">{cat.name}</span>
                  <span className="text-xs text-muted-foreground">{cat.count} jobs ({cat.pct}%)</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${cat.color} rounded-full transition-all`} style={{ width: `${cat.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Peak Hours */}
        <Card className="p-4 border border-border rounded-xl">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4"><Clock className="w-4 h-4 text-primary" />Peak Booking Hours</h3>
          <div className="space-y-2">
            {peakHours.map(h => (
              <div key={h.hour} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-16">{h.hour}</span>
                <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all flex items-center justify-end pr-2" style={{ width: `${(h.jobs / peakMax) * 100}%` }}>
                    {h.jobs > 5 && <span className="text-[10px] font-bold text-accent-foreground">{h.jobs}</span>}
                  </div>
                </div>
                {h.jobs <= 5 && <span className="text-[10px] text-muted-foreground w-4">{h.jobs}</span>}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top Customers */}
      <Card className="p-4 border border-border rounded-xl">
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4"><Users className="w-4 h-4 text-primary" />Top Repeat Customers</h3>
        <div className="space-y-3">
          {topCustomers.map((cust, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{cust.name.charAt(0)}</div>
                <div>
                  <p className="text-sm font-medium text-foreground">{cust.name}</p>
                  <p className="text-[11px] text-muted-foreground">{cust.jobs} jobs - Last: {cust.lastJob}</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-foreground">KES {cust.spent.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Conversion Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Profile Views", value: "1,240", sub: "This month" },
          { label: "View-to-Book Rate", value: "9.5%", sub: "118 of 1,240" },
          { label: "Response Time", value: "8 min", sub: "Avg reply" },
          { label: "Completion Rate", value: "96%", sub: "3 cancelled" },
        ].map((m, i) => (
          <Card key={i} className="p-3 border border-border rounded-xl text-center">
            <p className="text-lg font-bold text-foreground">{m.value}</p>
            <p className="text-[11px] text-muted-foreground">{m.label}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">{m.sub}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
