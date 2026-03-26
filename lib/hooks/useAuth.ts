"use client"

import { useCallback, useEffect, useState } from "react"
import type { User, UserRole } from "@/lib/types"
import { fetchSession, logoutSession } from "@/lib/services/auth-service"

const STORAGE_KEY = "saji_user"
const MOCK_AUTH_ENABLED = process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === "true"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Initialize auth on mount
  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      try {
        const serverSession = await fetchSession()

        if (serverSession?.ok && serverSession.user) {
          if (!isMounted) return
          setUser(serverSession.user)
          setIsAuthenticated(true)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(serverSession.user))
          setIsLoading(false)
          return
        }
      } catch {
        // Fall through to local storage compatibility mode.
      }

      if (MOCK_AUTH_ENABLED) {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          try {
            const parsedUser = JSON.parse(stored)
            if (!isMounted) return
            setUser(parsedUser)
            setIsAuthenticated(true)
          } catch {
            localStorage.removeItem(STORAGE_KEY)
          }
        }
      }

      if (isMounted) {
        setIsLoading(false)
      }
    }

    initializeAuth()

    return () => {
      isMounted = false
    }
  }, [])

  const login = useCallback((userData: User) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
    setUser(userData)
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(() => {
    void logoutSession()
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  const switchRole = useCallback(
    (newRole: UserRole) => {
      if (user) {
        const updatedUser = { ...user, role: newRole }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser))
        setUser(updatedUser)
      }
    },
    [user],
  )

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    switchRole,
  }
}
