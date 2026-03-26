import { apiRequest } from "@/lib/api/client"
import type { AdminDashboardResponse } from "@/lib/contracts/admin-dashboard"

export function fetchAdminDashboard(): Promise<AdminDashboardResponse> {
  return apiRequest<AdminDashboardResponse>("/api/admin/dashboard", {
    method: "GET",
    retries: 1,
  })
}
