"use client"

import { Card } from "@/components/ui/card"
import { Trophy, Medal, TrendingUp, Star, Users } from "lucide-react"

const agents = [
  { rank: 1, name: "You (Agent Mike)", cases: 127, resolved: 122, rating: 4.8, satisfaction: 96, earnings: "KES 45,500", isYou: true },
  { rank: 2, name: "Agent Sarah", cases: 118, resolved: 114, rating: 4.7, satisfaction: 94, earnings: "KES 42,100" },
  { rank: 3, name: "Agent David", cases: 105, resolved: 99, rating: 4.6, satisfaction: 92, earnings: "KES 38,800" },
  { rank: 4, name: "Agent Grace", cases: 98, resolved: 91, rating: 4.5, satisfaction: 90, earnings: "KES 35,200" },
  { rank: 5, name: "Agent Tom", cases: 87, resolved: 82, rating: 4.4, satisfaction: 88, earnings: "KES 31,500" },
  { rank: 6, name: "Agent Betty", cases: 79, resolved: 73, rating: 4.3, satisfaction: 86, earnings: "KES 28,900" },
  { rank: 7, name: "Agent James", cases: 72, resolved: 66, rating: 4.2, satisfaction: 84, earnings: "KES 26,100" },
  { rank: 8, name: "Agent Alice", cases: 65, resolved: 59, rating: 4.1, satisfaction: 82, earnings: "KES 23,400" },
]

export default function AgentLeaderboardPage() {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"><Trophy className="w-5 h-5 text-amber-600" /></div>
    if (rank === 2) return <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><Medal className="w-5 h-5 text-gray-500" /></div>
    if (rank === 3) return <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center"><Medal className="w-5 h-5 text-orange-600" /></div>
    return <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-400">#{rank}</div>
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Agent Leaderboard</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">See how you rank against other agents this month</p>
      </div>

      {/* Your Position Highlight */}
      <Card className="p-4 lg:p-5 border-0 shadow-sm bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-bold">#1</div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">Your Current Rank</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Top performer this month</p>
            </div>
          </div>
          <div className="flex gap-4 sm:ml-auto">
            <div className="text-center"><p className="text-xs text-gray-500">Cases</p><p className="text-lg font-bold text-gray-900 dark:text-white">127</p></div>
            <div className="text-center"><p className="text-xs text-gray-500">Rating</p><p className="text-lg font-bold text-amber-600">4.8</p></div>
            <div className="text-center"><p className="text-xs text-gray-500">Earnings</p><p className="text-lg font-bold text-emerald-600">KES 45.5K</p></div>
          </div>
        </div>
      </Card>

      {/* Leaderboard Table */}
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
              {agents.map(a => (
                <tr key={a.rank} className={`transition-colors ${a.isYou ? "bg-indigo-50 dark:bg-indigo-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"}`}>
                  <td className="px-4 py-3">{getRankIcon(a.rank)}</td>
                  <td className="px-4 py-3">
                    <p className={`text-sm font-semibold ${a.isYou ? "text-indigo-700 dark:text-indigo-400" : "text-gray-900 dark:text-white"}`}>{a.name}</p>
                    <p className="text-[10px] text-gray-500">{a.satisfaction}% satisfaction</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hidden sm:table-cell">{a.cases}</td>
                  <td className="px-4 py-3 hidden md:table-cell"><span className="text-sm font-medium text-emerald-600">{Math.round((a.resolved/a.cases)*100)}%</span></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /><span className="text-sm font-medium text-gray-900 dark:text-white">{a.rating}</span></div></td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white hidden sm:table-cell">{a.earnings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
