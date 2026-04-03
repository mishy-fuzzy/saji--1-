"use client"

import { Card } from "@/components/ui/card"
import { Users, Briefcase, DollarSign, TrendingUp } from "lucide-react"

export function AdminStats() {
  const stats = []

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
