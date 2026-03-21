"use client"

import { Card } from "@/components/ui/card"
import { Users, Briefcase, DollarSign, TrendingUp } from "lucide-react"

export function AdminStats() {
  const stats = [
    {
      label: "Total Users",
      value: "2,450",
      change: "+12%",
      icon: Users,
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "Active Jobs",
      value: "324",
      change: "+8%",
      icon: Briefcase,
      color: "from-primary to-secondary",
    },
    {
      label: "Total Revenue",
      value: "KES 4.2M",
      change: "+23%",
      icon: DollarSign,
      color: "from-green-500 to-green-600",
    },
    {
      label: "Commission Collected",
      value: "KES 840K",
      change: "+15%",
      icon: TrendingUp,
      color: "from-purple-500 to-purple-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="p-6 border-2 hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} text-white`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-green-600 dark:text-green-400">{stat.change}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-foreground">{stat.value}</p>
          </Card>
        )
      })}
    </div>
  )
}
