"use client"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ServiceDetail } from "@/components/services/service-detail"

export default function ServiceDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ServiceDetail serviceId={params.id} />
      </main>
      <Footer />
    </div>
  )
}
