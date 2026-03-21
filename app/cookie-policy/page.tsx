export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-4">Cookie Policy</h1>
        <p className="text-muted-foreground mb-6">
          SAJI uses cookies and similar storage technologies to keep you signed in, remember preferences,
          and improve performance.
        </p>
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>Essential cookies are used for authentication, security, and core platform functionality.</p>
          <p>Preference cookies remember settings like language and theme where applicable.</p>
          <p>Analytics cookies may be used to measure usage patterns and improve user experience.</p>
          <p>You can control cookies in your browser settings, but disabling them may affect key features.</p>
        </div>
      </div>
    </div>
  )
}
