import { apiRequest } from "@/lib/api/client"
import type { AgentNotificationsResponse } from "@/lib/contracts/agent-notifications"

export function fetchAgentNotifications(): Promise<AgentNotificationsResponse> {
  return apiRequest<AgentNotificationsResponse>("/api/agent/notifications", {
    method: "GET",
    retries: 1,
  })
}
