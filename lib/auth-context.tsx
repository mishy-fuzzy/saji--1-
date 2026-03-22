"use client"

import { createContext, useContext, useCallback, type ReactNode } from "react"
import { useAuth } from "@/lib/hooks/useAuth"
import { useRouter } from "next/navigation"
import type { User } from "@/lib/types"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
  switchRole: (role: "customer" | "provider" | "admin") => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const router = useRouter()

  const logoutWithRedirect = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {
      // Keep local logout behavior even when network call fails.
    }

    auth.logout()
    router.push("/")
  }, [auth, router])

  const contextValue: AuthContextType = {
    ...auth,
    logout: logoutWithRedirect,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider")
  }
  return context
}
