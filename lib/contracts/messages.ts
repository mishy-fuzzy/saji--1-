export interface MessageThreadApiMemberUser {
  id: string
  name: string
  email: string
  avatar?: string | null
}

export interface MessageThreadApiMember {
  id: string
  threadId: string
  userId: string
  user: MessageThreadApiMemberUser
}

export interface MessageThreadApiMessage {
  id: string
  threadId: string
  senderId: string
  body: string
  createdAt?: string
  sender?: {
    id: string
    name: string
  }
}

export interface MessageThreadApiItem {
  id: string
  title?: string | null
  members: MessageThreadApiMember[]
  messages: MessageThreadApiMessage[]
}

export interface MessageThreadsResponse {
  ok: boolean
  threads: MessageThreadApiItem[]
}
