"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Users, Award, AlertCircle } from "lucide-react"

export default function PerformancePage() {
  const performanceData = [
    { agent: "Daniel K.", cases: 127, resolved: 122, rating: 4.8, satisfaction: 96, status: "Excellent" },
    { agent: "Grace M.", cases: 98, resolved: 94, rating: 4.6, satisfaction: 92, status: "Good" },
    { agent: "Robert J.", cases: 112, resolved: 107, rating: 4.7, satisfaction: 94, status: "Excellent" },
  ]

  const benchmarks = [
    { metric: "Avg Cases Handled", value: 112, target: 100, status: "above" },
    { metric: "Resolution Rate", value: "95%", target: "90%", status: "above" },
    { metric: "Customer Satisfaction", value: "94%", target: "90%", status: "above" },
  ]

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Team Performance</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Monitor agent performance metrics and achievements</p>
      </div>

      {/* Benchmarks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {benchmarks.map((item, idx) => (
          <Card key={idx} className="p-6">
            <p className="text-sm text-muted-foreground mb-3">{item.metric}</p>
            <div className="flex items-baseline gap-2 mb-4">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{item.value}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">vs {item.target}</p>
            </div>
            <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-300 rounded-full"></div>
          </Card>
        ))}
      </div>

      {/* Performance Table */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Agent Performance Overview</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Agent</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Cases</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Resolved</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Rating</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Satisfaction</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {performanceData.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{item.agent}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{item.cases}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{item.resolved}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                    <span>★</span> {item.rating}
                  </td>
                  <td className="px-6 py-4 text-sm text-emerald-600 dark:text-emerald-400 font-medium">{item.satisfaction}%</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
