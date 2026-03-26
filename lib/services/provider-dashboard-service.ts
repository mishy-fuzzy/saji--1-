import { apiRequest } from "@/lib/api/client"
import type { ProviderDashboardResponse } from "@/lib/contracts/provider-dashboard"

export function fetchProviderDashboard(): Promise<ProviderDashboardResponse> {
  return apiRequest<ProviderDashboardResponse>("/api/provider/dashboard", {
    method: "GET",
    retries: 1,
  })
}
