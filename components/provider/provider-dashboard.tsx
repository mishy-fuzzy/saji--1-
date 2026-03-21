"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, AlertCircle, Star, ChevronRight } from "lucide-react"
import { JobDetailModal } from "./job-detail-modal"
import { ProviderStats } from "./provider-stats"

interface ProviderDashboardProps {
  provider: {
    id: string
    fullName: string
    email: string
  }
}

const mockJobs = [
  {
    id: 1,
    title: "Electrical Installation - Living Room",
    customer: "Sarah M.",
    status: "in-progress",
    date: "2025-01-08",
    amount: 5000,
    rating: null,
    progress: 65,
  },
  {
    id: 2,
    title: "Full Building Wiring",
    customer: "David K.",
    status: "awaiting-confirmation",
    date: "2025-01-10",
    amount: 12000,
    rating: null,
    progress: 100,
  },
  {
    id: 3,
    title: "Office Rewiring Project",
    customer: "Tech Corp Ltd",
    status: "completed",
    date: "2025-01-05",
    amount: 8000,
    rating: 5,
    progress: 100,
  },
]

const statusConfig = {
  "in-progress": {
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    icon: Clock,
    label: "In Progress",
  },
  "awaiting-confirmation": {
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
    icon: AlertCircle,
    label: "Awaiting Confirmation",
  },
  completed: {
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    icon: CheckCircle,
    label: "Completed",
  },
}

export function ProviderDashboard({ provider }: ProviderDashboardProps) {
  const [selectedTab, setSelectedTab] = useState("active")
  const [selectedJob, setSelectedJob] = useState<(typeof mockJobs)[0] | null>(null)
  const [isJobDetailOpen, setIsJobDetailOpen] = useState(false)

  const activeJobs = mockJobs.filter((j) => j.status !== "completed").length
  const completedJobs = mockJobs.filter((j) => j.status === "completed").length
  const totalEarnings = mockJobs.reduce((sum, j) => sum + j.amount, 0)

  const handleJobSelect = (job: (typeof mockJobs)[0]) => {
    setSelectedJob(job)
    setIsJobDetailOpen(true)
  }

  const renderStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig]
    const Icon = config.icon
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Provider Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {provider.fullName}! Manage your jobs and earnings.</p>
      </div>

      {/* Stats Overview */}
      <ProviderStats activeJobs={activeJobs} completedJobs={completedJobs} totalEarnings={totalEarnings} />

      {/* Jobs Section */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="offers">Offers</TabsTrigger>
          </TabsList>
        </div>

        {/* Active Jobs Tab */}
        <TabsContent value="active" className="space-y-4">
          {mockJobs
            .filter((j) => j.status !== "completed")
            .map((job) => (
              <Card
                key={job.id}
                className="p-6 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => handleJobSelect(job)}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {job.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">Customer: {job.customer}</p>
                  </div>
                  {renderStatusBadge(job.status)}
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">Progress</span>
                    <span className="text-sm font-semibold text-foreground">{job.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-primary">KES {job.amount.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground">{job.date}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            ))}
        </TabsContent>

        {/* Completed Jobs Tab */}
        <TabsContent value="completed" className="space-y-4">
          {mockJobs
            .filter((j) => j.status === "completed")
            .map((job) => (
              <Card key={job.id} className="p-6 hover:shadow-lg transition-all cursor-pointer group">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {job.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">Customer: {job.customer}</p>
                  </div>
                  {renderStatusBadge(job.status)}
                </div>

                {/* Rating */}
                {job.rating && (
                  <div className="mb-4 flex items-center gap-1">
                    {[...Array(job.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-secondary text-secondary" />
                    ))}
                    <span className="ml-2 text-sm font-semibold text-foreground">{job.rating}.0 stars</span>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-primary">KES {job.amount.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground">{job.date}</span>
                  </div>
                  <Button variant="outline" size="sm" className="border-2 bg-transparent rounded-lg">
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
        </TabsContent>

        {/* Offers Tab */}
        <TabsContent value="offers" className="space-y-4">
          <Card className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No pending offers right now</p>
            <p className="text-sm text-muted-foreground mb-6">Complete your profile to receive more job offers</p>
            <Button className="rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
              Complete Profile
            </Button>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Job Detail Modal */}
      {selectedJob && <JobDetailModal job={selectedJob} isOpen={isJobDetailOpen} onOpenChange={setIsJobDetailOpen} />}
    </div>
  )
}
