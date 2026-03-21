"use client"

import { Card } from "@/components/ui/card"
import { TrendingUp, DollarSign, Clock, CheckCircle } from "lucide-react"

interface ProviderStatsProps {
  activeJobs: number
  completedJobs: number
  totalEarnings: number
}

export function ProviderStats({ activeJobs, completedJobs, totalEarnings }: ProviderStatsProps) {
  const stats = [
    {
      label: "Active Jobs",
      value: activeJobs.toString(),
      subtext: "Currently in progress",
      icon: Clock,
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "Completed",
      value: completedJobs.toString(),
      subtext: "Total delivered",
      icon: CheckCircle,
      color: "from-green-500 to-green-600",
    },
    {
      label: "Total Earnings",
      value: `KES ${totalEarnings.toLocaleString()}`,
      subtext: "From all jobs",
      icon: DollarSign,
      color: "from-primary to-secondary",
    },
    {
      label: "Response Rate",
      value: "98%",
      subtext: "Very fast responder",
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
            </div>
            <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.subtext}</p>
          </Card>
        )
      })}
    </div>
  )
}
