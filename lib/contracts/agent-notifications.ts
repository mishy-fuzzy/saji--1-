export interface AgentNotificationItem {
  id: string
  text: string
  time: string
}

export interface AgentNotificationsResponse {
  ok: boolean
  notifications: AgentNotificationItem[]
}
