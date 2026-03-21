import Link from "next/link"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground mb-6">
          This page explains how SAJI collects, uses, and protects your personal data.
        </p>
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>We collect profile details, service requests, and payment-related information needed to operate the platform.</p>
          <p>We use your data to deliver services, improve reliability, and communicate important account updates.</p>
          <p>You can request data export or account deletion from settings where available.</p>
          <p>For full customer-facing policy details, refer to the dedicated policy page below.</p>
        </div>
        <div className="mt-8">
          <Link href="/customer/privacy-policy" className="text-primary hover:underline">
            Open Full Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  )
}
