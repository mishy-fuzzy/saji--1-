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
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsedUser = JSON.parse(stored)
        setUser(parsedUser)
        setIsAuthenticated(true)
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setIsLoading(false)
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
