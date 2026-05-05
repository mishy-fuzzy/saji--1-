"use client"

import { useCallback, useEffect, useState } from "react"
import type { User, UserRole } from "@/lib/types"

const STORAGE_KEY = "saji_user"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Initialize auth on mount
  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      let storedUser: User | null = null
      const stored = localStorage.getItem(STORAGE_KEY)

      if (stored) {
        try {
          storedUser = JSON.parse(stored) as User
          if (isMounted) {
            setUser(storedUser)
            setIsAuthenticated(true)
          }
        } catch {
          localStorage.removeItem(STORAGE_KEY)
          storedUser = null
        }
      }

      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" })

        if (response.ok) {
          const payload = await response.json()
          if (payload?.ok && payload?.data && isMounted) {
            const serverUser = payload.data as User
            localStorage.setItem(STORAGE_KEY, JSON.stringify(serverUser))
            setUser(serverUser)
            setIsAuthenticated(true)
          }
        } else if (isMounted) {
          if (response.status === 401 || response.status === 403) {
            // Clear stale local auth when the session is invalid server-side.
            localStorage.removeItem(STORAGE_KEY)
            setUser(null)
            setIsAuthenticated(false)
          } else if (!storedUser) {
            setUser(null)
            setIsAuthenticated(false)
          }
        }
      } catch {
        // Preserve local auth fallback when network checks are unavailable.
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
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
