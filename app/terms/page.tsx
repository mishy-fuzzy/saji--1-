import Link from "next/link"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
        <p className="text-muted-foreground mb-6">
          These terms describe the rules for using SAJI services.
        </p>
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>By using SAJI, you agree to provide accurate account information and use the platform lawfully.</p>
          <p>Providers are responsible for service quality and compliance with local regulations.</p>
          <p>Payments, refunds, and disputes are governed by our platform policies and applicable laws.</p>
          <p>We may update these terms from time to time. Continued usage means you accept updates.</p>
        </div>
        <div className="mt-8">
          <Link href="/privacy" className="text-primary hover:underline">
            Read Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  )
}
