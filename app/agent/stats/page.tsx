"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp, Award, Users } from "lucide-react"

export default function AgentStatsPage() {
  const stats = [
    { label: "Total Cases Handled", value: "1,247", icon: Users, color: "bg-blue-100 dark:bg-blue-900/30", trend: "+89 this month" },
    { label: "Average Rating", value: "4.8/5", icon: Award, color: "bg-yellow-100 dark:bg-yellow-900/30", trend: "Excellent" },
    { label: "Resolution Rate", value: "96%", icon: TrendingUp, color: "bg-green-100 dark:bg-green-900/30", trend: "+2% vs last month" },
    { label: "Customer Satisfaction", value: "94%", icon: Users, color: "bg-purple-100 dark:bg-purple-900/30", trend: "Top performer" },
  ]

  const monthlyStats = [
    { month: "Jan", cases: 127, resolved: 122, rating: 4.8 },
    { month: "Dec", cases: 108, resolved: 104, rating: 4.7 },
    { month: "Nov", cases: 119, resolved: 114, rating: 4.8 },
    { month: "Oct", cases: 101, resolved: 97, rating: 4.6 },
  ]

  const topMetrics = [
    { title: "Fastest Response Time", value: "1.2h", benchmark: "2.3h avg" },
    { title: "Highest Resolution", value: "98%", benchmark: "96% avg" },
    { title: "Customer Repeat Rate", value: "87%", benchmark: "75% avg" },
  ]

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Performance Statistics</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Your detailed performance metrics and achievements</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{stat.value}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{stat.trend}</p>
            </Card>
          )
        })}
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topMetrics.map((metric, idx) => (
          <Card key={idx} className="p-6">
            <p className="text-sm text-muted-foreground mb-3">{metric.title}</p>
            <div className="flex items-baseline gap-2 mb-4">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{metric.value}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">vs {metric.benchmark}</p>
            </div>
            <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-300 rounded-full"></div>
          </Card>
        ))}
      </div>

      {/* Monthly Stats */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Monthly Performance
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Month</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Cases Handled</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Cases Resolved</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Resolution Rate</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {monthlyStats.map((stat, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{stat.month}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{stat.cases}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{stat.resolved}</td>
                  <td className="px-6 py-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {Math.round((stat.resolved / stat.cases) * 100)}%
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                    <span className="text-yellow-500">★</span> {stat.rating}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Achievement Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <p className="text-sm text-muted-foreground mb-2">Top Performer Badge</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">Earned in 5 consecutive months</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Keep up the exceptional performance!</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <p className="text-sm text-muted-foreground mb-2">Excellence Award</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">Customer Satisfaction {String.fromCharCode(62)}95%</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">You are in the top 10% of agents!</p>
        </Card>
      </div>
    </div>
  )
}
