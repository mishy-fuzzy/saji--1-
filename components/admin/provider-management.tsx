"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, MoreVertical, Shield, Ban, TrendingUp } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const mockProviders = [
  {
    id: 1,
    name: "John Electrical Services",
    category: "skilled",
    rating: 4.9,
    jobs: 45,
    revenue: 225000,
    status: "verified",
    joinDate: "2019-05-15",
  },
  {
    id: 2,
    name: "Pipe Master",
    category: "semi-skilled",
    rating: 4.8,
    jobs: 32,
    revenue: 64000,
    status: "verified",
    joinDate: "2020-08-22",
  },
  {
    id: 3,
    name: "Clean Sweep Team",
    category: "non-skilled",
    rating: 4.7,
    jobs: 89,
    revenue: 133500,
    status: "verified",
    joinDate: "2021-03-10",
  },
]

const statusColors = {
  verified: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
}

export function ProviderManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [providers, setProviders] = useState(mockProviders)

  const filteredProviders = providers.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-lg">Provider Management</h3>
        <Button className="rounded-lg bg-primary text-primary-foreground">Add Provider</Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search providers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-lg border-2 border-border focus-visible:border-primary"
          />
        </div>
        <Button variant="outline" className="border-2 gap-2 rounded-lg bg-transparent">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="px-4 py-3 text-left font-semibold text-foreground">Provider</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Category</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Rating</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Jobs</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Revenue</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProviders.map((provider) => (
              <tr key={provider.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                <td className="px-4 py-4">
                  <div>
                    <p className="font-semibold text-foreground">{provider.name}</p>
                    <p className="text-xs text-muted-foreground">Joined {provider.joinDate}</p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 capitalize">
                    {provider.category}
                  </Badge>
                </td>
                <td className="px-4 py-4">
                  <span className="font-semibold text-primary">{provider.rating}★</span>
                </td>
                <td className="px-4 py-4">
                  <span className="font-semibold text-foreground">{provider.jobs}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="font-semibold text-foreground">KES {provider.revenue.toLocaleString()}</span>
                </td>
                <td className="px-4 py-4">
                  <Badge className={statusColors[provider.status as keyof typeof statusColors]}>
                    {provider.status}
                  </Badge>
                </td>
                <td className="px-4 py-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2">
                        <Shield className="w-4 h-4" />
                        Verify Account
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <TrendingUp className="w-4 h-4" />
                        View Analytics
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-destructive">
                        <Ban className="w-4 h-4" />
                        Suspend
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
