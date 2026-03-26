export interface AdminChartPoint {
  day: string
  earnings: number
  commission: number
  users: number
}

export interface AdminPiePoint {
  name: string
  value: number
  color: string
}

export interface AdminRecentActivity {
  label: string
  detail: string
  time: string
  type: "user" | "job" | "completed" | "dispute"
}

export interface AdminTopPerformer {
  name: string
  earnings: number
  status: "Active" | "Inactive"
  tasks: number
}

export interface AdminDashboardSummary {
  totalUsers: number
  activeJobs: number
  completedTasks: number
  openDisputes: number
  totalRevenue: number
  totalCommission: number
  averageTransaction: number
}

export interface AdminDashboardResponse {
  ok: boolean
  summary: AdminDashboardSummary
  chartData: AdminChartPoint[]
  pieData: AdminPiePoint[]
  recentActivities: AdminRecentActivity[]
  topPerformers: AdminTopPerformer[]
}
