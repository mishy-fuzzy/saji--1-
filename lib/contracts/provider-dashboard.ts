export interface ProviderDashboardJob {
  id: string
  title: string
  customer: string
  status: "in-progress" | "pending" | "completed"
  amount: number
  date: string
}

export interface ProviderDashboardStats {
  activeJobs: number
  completedJobs: number
  totalEarnings: number
  rating: string
}

export interface ProviderDashboardResponse {
  ok: boolean
  stats: ProviderDashboardStats
  jobs: ProviderDashboardJob[]
}
