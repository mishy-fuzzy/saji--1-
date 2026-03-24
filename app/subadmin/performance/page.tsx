"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Users, Award, AlertCircle } from "lucide-react"

export default function PerformancePage() {
  const performanceData: Array<{ agent: string; cases: number; resolved: number; rating: number; satisfaction: number; status: string }> = []

  const benchmarks: Array<{ metric: string; value: string | number; target: string | number; status: string }> = []

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
        {benchmarks.length === 0 && (
          <Card className="p-6 md:col-span-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">No performance benchmarks available.</p>
          </Card>
        )}
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
              {performanceData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No agent performance records available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
