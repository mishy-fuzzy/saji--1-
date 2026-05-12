"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/lib/auth-context"
import { LoadingScreen } from "@/components/loading-screen"
import { CustomerHome } from "@/components/pages/customer-home"

export default function CustomerHomePage() {
  const { isAuthenticated, isLoading, user } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return // ✅ Wait until loading is done

    if (!isAuthenticated || user?.role !== "customer") {
      router.replace("/")
    }
  }, [isAuthenticated, isLoading, user?.role]) // ✅ Removed `router`, use `user?.role` not full `user`

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated || user?.role !== "customer") {
    return null
  }

  return <CustomerHome />
}