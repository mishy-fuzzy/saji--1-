"use client"

import { Suspense } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ServiceBrowser } from "@/components/services/service-browser"

function ServiceBrowserPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ServiceBrowser />
      </main>
      <Footer />
    </div>
  )
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ServiceBrowserPage />
    </Suspense>
  )
}
