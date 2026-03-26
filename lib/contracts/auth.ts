import type { User } from "@/lib/types"

export interface SessionResponse {
  ok: boolean
  user: User | null
}

export interface LoginRequest {
  email?: string
  phone?: string
  password: string
}

export interface LoginResponse {
  ok: boolean
  user: User
  token?: string
  routeRole?: string
}
