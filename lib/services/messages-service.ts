import { apiRequest } from "@/lib/api/client"
import type { MessageThreadsResponse } from "@/lib/contracts/messages"

export function fetchMessageThreads(userId: string): Promise<MessageThreadsResponse> {
  const query = `/api/messages/threads?userId=${encodeURIComponent(userId)}`
  return apiRequest<MessageThreadsResponse>(query, {
    method: "GET",
    retries: 1,
  })
}
