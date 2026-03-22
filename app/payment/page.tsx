"use client"

import { Suspense } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PaymentPage } from "@/components/payment/payment-page"

function PaymentContent() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-12">
        <PaymentPage />
      </main>
      <Footer />
    </div>
  )
}

export default function Payment() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentContent />
    </Suspense>
  )
}
