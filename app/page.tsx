"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/lib/auth-context"
import { LoadingScreen } from "@/components/loading-screen"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { LandingPage } from "@/components/pages/landing-page"

export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuthContext()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isLoading && mounted && isAuthenticated && user) {
      if (user.role === "customer") {
        router.push("/customer/home")
      } else if (user.role === "provider") {
        router.push("/provider")
      } else if (user.role === "admin") {
        router.push("/admin")
      } else if (user.role === "sub-admin") {
        router.push("/sub-admin")
      } else if (user.role === "secretary") {
        router.push("/secretary")
      } else if (user.role === "agent") {
        router.push("/agent")
      }
    }
  }, [isAuthenticated, isLoading, user, router, mounted])

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <LandingPage />
      </main>
      <Footer />
    </div>
  )
}
