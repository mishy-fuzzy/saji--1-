"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { SettingsPage } from "@/components/settings/settings-page"

function SettingsContent() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <SettingsPage />
      </main>
      <Footer />
    </div>
  )
}

export default function Settings() {
  return <SettingsContent />
}
