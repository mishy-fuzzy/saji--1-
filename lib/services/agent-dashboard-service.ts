import { apiRequest } from "@/lib/api/client"
import type { AgentDashboardResponse } from "@/lib/contracts/agent-dashboard"

export function fetchAgentDashboard(): Promise<AgentDashboardResponse> {
  return apiRequest<AgentDashboardResponse>("/api/agent/dashboard", {
    method: "GET",
    retries: 1,
  })
}
