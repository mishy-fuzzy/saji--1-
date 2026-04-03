"use client"

import { useEffect, useMemo, useState } from "react"
import { Medal, Star, Trophy } from "lucide-react"
import { Card } from "@/components/ui/card"

type LeaderboardAgent = {
  rank: number
  name: string
  cases: number
  resolved: number
  rating: number
  satisfaction: number
  earnings: string
  isCurrentUser?: boolean
}

export default function AgentLeaderboardPage() {
  const [agents, setAgents] = useState<LeaderboardAgent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const loadLeaderboard = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/agent/leaderboard", {
          cache: "no-store",
          signal: controller.signal,
        })
        const payload = await response.json()

        if (!response.ok || !payload?.ok || !Array.isArray(payload?.data)) {
          throw new Error(payload?.error || "Failed to load leaderboard")
        }

        setAgents(
          payload.data.map((row: Partial<LeaderboardAgent>) => ({
            rank: Number(row.rank || 0),
            name: String(row.name || "Agent"),
            cases: Number(row.cases || 0),
            resolved: Number(row.resolved || 0),
            rating: Number(row.rating || 0),
            satisfaction: Number(row.satisfaction || 0),
            earnings: String(row.earnings || "KES 0"),
            isCurrentUser: Boolean(row.isCurrentUser),
          })),
        )
      } catch (err) {
        if (controller.signal.aborted) return
        const message = err instanceof Error ? err.message : "Failed to load leaderboard"
        setError(message)
        setAgents([])
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadLeaderboard()
    const intervalId = window.setInterval(loadLeaderboard, 30000)

    return () => {
      controller.abort()
      window.clearInterval(intervalId)
    }
  }, [])

  const currentAgent = useMemo(() => agents.find((agent) => agent.isCurrentUser) || agents[0] || null, [agents])

  const getRankIcon = (rank: number) => {
    if (rank === 1)
      return (
        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-amber-600" />
        </div>
      )
    if (rank === 2)
      return (
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <Medal className="w-5 h-5 text-gray-500" />
        </div>
      )
    if (rank === 3)
      return (
        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
          <Medal className="w-5 h-5 text-orange-600" />
        </div>
      )
    return (
      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-400">
        #{rank}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Agent Leaderboard</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Live ranking from the database</p>
      </div>

      {error ? (
        <Card className="p-4 border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm">
          Failed to load leaderboard from the database: {error}
        </Card>
      ) : null}

      <Card className="p-4 lg:p-5 border-0 shadow-sm bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-bold">
              #{currentAgent?.rank || 0}
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">Current Position</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentAgent ? currentAgent.name : "No live ranking available yet"}
              </p>
            </div>
          </div>
          <div className="flex gap-4 sm:ml-auto">
            <div className="text-center">
              <p className="text-xs text-gray-500">Cases</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{currentAgent?.cases ?? 0}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Rating</p>
              <p className="text-lg font-bold text-amber-600">{currentAgent ? currentAgent.rating.toFixed(1) : "0.0"}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Earnings</p>
              <p className="text-lg font-bold text-emerald-600">{currentAgent?.earnings || "KES 0"}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Agent</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 hidden sm:table-cell">Cases</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 hidden md:table-cell">Resolution</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Rating</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 hidden sm:table-cell">Earnings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    Loading leaderboard from the database...
                  </td>
                </tr>
              ) : agents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No agents found.
                  </td>
                </tr>
              ) : (
                agents.map((agent) => (
                  <tr
                    key={`${agent.rank}-${agent.name}`}
                    className={`transition-colors ${agent.isCurrentUser ? "bg-indigo-50 dark:bg-indigo-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"}`}
                  >
                    <td className="px-4 py-3">{getRankIcon(agent.rank)}</td>
                    <td className="px-4 py-3">
                      <p className={`text-sm font-semibold ${agent.isCurrentUser ? "text-indigo-700 dark:text-indigo-400" : "text-gray-900 dark:text-white"}`}>
                        {agent.name}
                      </p>
                      <p className="text-[10px] text-gray-500">{agent.satisfaction}% satisfaction</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hidden sm:table-cell">{agent.cases}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm font-medium text-emerald-600">
                        {agent.cases > 0 ? Math.round((agent.resolved / agent.cases) * 100) : 0}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{agent.rating.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white hidden sm:table-cell">{agent.earnings}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
