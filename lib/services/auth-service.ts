import { apiRequest, ApiError } from "@/lib/api/client"
import type { LoginRequest, LoginResponse, SessionResponse } from "@/lib/contracts/auth"

export async function fetchSession(): Promise<SessionResponse | null> {
  try {
    return await apiRequest<SessionResponse>("/api/auth/session", {
      method: "GET",
      retries: 1,
    })
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null
    }
    throw error
  }
}

export async function loginWithCredentials(payload: LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: payload,
  })
}

export async function logoutSession(): Promise<void> {
  await apiRequest<{ ok: boolean }>("/api/auth/logout", {
    method: "POST",
  })
}
