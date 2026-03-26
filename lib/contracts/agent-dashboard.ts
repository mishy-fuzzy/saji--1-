export interface AgentDisputeItem {
  id: string
  provider: string
  customer: string
  status: "Open" | "In Progress" | "Resolved"
  severity: "High" | "Medium" | "Low"
  amount: string
  date: string
  description: string
  resolution: string
}

export interface AgentDashboardStats {
  openDisputes: number
  customersHelped: number
  pendingQueries: number
  resolvedToday: number
}

export interface AgentPerformanceMetric {
  label: string
  value: string
  benchmark: string
}

export interface AgentRecentActivity {
  type: "dispute_resolved" | "query_answered" | "escalation" | "assignment"
  description: string
  time: string
}

export interface AgentDashboardResponse {
  ok: boolean
  stats: AgentDashboardStats
  disputes: AgentDisputeItem[]
  performanceMetrics: AgentPerformanceMetric[]
  recentActivity: AgentRecentActivity[]
}
