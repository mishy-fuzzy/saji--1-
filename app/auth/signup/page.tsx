"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthContext } from "@/lib/auth-context"
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Apple, ArrowLeft, Sparkles, Shield, Clock } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { UserRole } from "@/lib/types"

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuthContext()
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true"
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", password: "", confirmPassword: "",
    role: (searchParams.get("role") as UserRole) || ("customer" as UserRole),
    agreeTerms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const roleFromQuery = searchParams.get("role") as UserRole | null
    if (roleFromQuery) {
      setFormData((prev) => ({ ...prev, role: roleFromQuery }))
    }

    const errorFromQuery = searchParams.get("error")
    if (errorFromQuery) {
      setError(errorFromQuery)
    }
  }, [searchParams])

  const handleChange = (field: string, value: string | boolean) => setFormData((prev) => ({ ...prev, [field]: value }))

  const validateStep1 = () => {
    if (!formData.name || !formData.email || !formData.phone) { setError("Please fill in all fields"); return false }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { setError("Please enter a valid email"); return false }
    return true
  }

  const validateStep2 = () => {
    if (!formData.password || !formData.confirmPassword) { setError("Please fill in all fields"); return false }
    if (formData.password.length < 8) { setError("Password must be at least 8 characters"); return false }
    if (formData.password !== formData.confirmPassword) { setError("Passwords do not match"); return false }
    if (!formData.agreeTerms) { setError("Please agree to the terms and conditions"); return false }
    return true
  }

  const handleNext = () => { setError(""); if (step === 1 && validateStep1()) setStep(2) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("")
    if (!validateStep2()) return
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          password: formData.password,
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Signup failed")
      }

      login(payload.data)
      if (formData.role === "customer") router.push("/customer/home")
      else if (formData.role === "provider") router.push("/provider")
      else if (formData.role === "shopkeeper") router.push("/shopkeeper/register")
      else if (formData.role === "admin") router.push("/admin")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = () => {
    if (!googleEnabled) {
      setError("Google sign-in is not configured yet. Please use email/password login.")
      return
    }
    window.location.href = `/api/auth/google/start?mode=signup&role=${formData.role}`
  }
  const handleAppleSignup = () => setError("Apple sign-up is not configured yet. Please use email/password signup.")

  // Password strength
  const getPasswordStrength = () => {
    const p = formData.password
    if (!p) return { label: "", width: "0%", color: "" }
    let score = 0
    if (p.length >= 8) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    if (score <= 1) return { label: "Weak", width: "25%", color: "bg-destructive" }
    if (score === 2) return { label: "Fair", width: "50%", color: "bg-amber-500" }
    if (score === 3) return { label: "Good", width: "75%", color: "bg-emerald-500" }
    return { label: "Strong", width: "100%", color: "bg-emerald-600" }
  }
  const pwStrength = getPasswordStrength()

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col justify-between relative overflow-hidden bg-primary text-primary-foreground p-10">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-white/5 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
              <span className="text-lg font-bold">S</span>
            </div>
            <span className="text-xl font-bold tracking-tight">SAJI</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight mb-3">Join SAJI today</h1>
          <p className="text-white/70 text-sm leading-relaxed max-w-xs">Create your account and start connecting with trusted professionals in minutes.</p>
        </div>

        <div className="relative z-10 space-y-5">
          {[
            { icon: Sparkles, title: "Quick & Easy Signup", desc: "Create your account in just 2 steps" },
            { icon: Shield, title: "Secure Account", desc: "Your data is protected and encrypted" },
            { icon: Clock, title: "Instant Access", desc: "Start using SAJI immediately" },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-sm">{item.title}</p>
                <p className="text-white/60 text-xs">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="relative z-10 text-white/40 text-xs">&copy; {new Date().getFullYear()} SAJI. All rights reserved.</p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-8">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-base font-bold text-primary-foreground">S</span>
            </div>
            <span className="text-lg font-bold text-foreground">SAJI</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">Create Account</h2>
          <p className="text-sm text-muted-foreground mb-5">Join SAJI in 2 simple steps</p>

          {/* Progress */}
          <div className="flex gap-2 mb-5">
            <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
            <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
          )}

          {/* Role */}
          <div className="mb-5">
            <label className="text-sm font-medium text-foreground mb-1.5 block">I want to</label>
            <Select value={formData.role} onValueChange={(v) => handleChange("role", v)}>
              <SelectTrigger className="h-10 rounded-xl border-border bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Find Services</SelectItem>
                <SelectItem value="provider">Provide Services</SelectItem>
                <SelectItem value="shopkeeper">Sell Products</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); handleNext() }} className="space-y-4">
              <div>
                <label htmlFor="name" className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="name" type="text" placeholder="Your full name" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} className="pl-9 h-10 rounded-xl border-border bg-card" disabled={isLoading} />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-medium text-foreground mb-1.5 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="you@example.com" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} className="pl-9 h-10 rounded-xl border-border bg-card" disabled={isLoading} />
                </div>
              </div>
              <div>
                <label htmlFor="phone" className="text-sm font-medium text-foreground mb-1.5 block">Phone Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">+254</span>
                  <Input id="phone" type="tel" placeholder="712345678" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} className="pl-12 h-10 rounded-xl border-border bg-card" disabled={isLoading} />
                </div>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full h-10 rounded-xl font-semibold gap-2">
                Next Step <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min 8 characters" value={formData.password} onChange={(e) => handleChange("password", e.target.value)} className="pl-9 pr-9 h-10 rounded-xl border-border bg-card" disabled={isLoading} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" disabled={isLoading}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-muted-foreground">Password strength</span>
                      <span className={`text-[11px] font-medium ${pwStrength.color === "bg-destructive" ? "text-destructive" : pwStrength.color === "bg-amber-500" ? "text-amber-600" : "text-emerald-600"}`}>
                        {pwStrength.label}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${pwStrength.color}`} style={{ width: pwStrength.width }} />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="confirm" className="text-sm font-medium text-foreground mb-1.5 block">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="confirm" type={showConfirm ? "text" : "password"} placeholder="Re-enter password" value={formData.confirmPassword} onChange={(e) => handleChange("confirmPassword", e.target.value)} className="pl-9 pr-9 h-10 rounded-xl border-border bg-card" disabled={isLoading} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" disabled={isLoading}>
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <Checkbox checked={formData.agreeTerms} onCheckedChange={(c) => handleChange("agreeTerms", c as boolean)} disabled={isLoading} className="mt-0.5" />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  I agree to the <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                </span>
              </label>
              <div className="flex gap-3">
                <Button type="button" onClick={() => setStep(1)} disabled={isLoading} variant="outline" className="flex-1 h-10 rounded-xl bg-transparent gap-1">
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1 h-10 rounded-xl font-semibold">
                  {isLoading ? "Creating..." : "Create Account"}
                </Button>
              </div>
            </form>
          )}

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">optional social sign-up</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Social */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" onClick={handleGoogleSignup} disabled={isLoading || !googleEnabled} variant="outline" className="h-10 rounded-xl bg-card gap-2 text-sm font-medium">
                <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.64-.15-3.21-.43-4.73H24v9.01h12.4c-.54 2.91-2.18 5.38-4.65 7.04l7.2 5.59c4.21-3.88 6.65-9.6 6.65-16.91z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.81l-7.2-5.59c-2 1.35-4.56 2.15-8.7 2.15-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                Google
              </Button>
              <Button type="button" onClick={handleAppleSignup} disabled={isLoading} className="h-10 rounded-xl gap-2 text-sm font-medium bg-foreground text-background hover:bg-foreground/90">
                <Apple className="w-4 h-4" /> Apple
              </Button>
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account? <Link href="/auth/login" className="font-semibold text-primary hover:underline">Sign in</Link>
            <span className="mx-2 text-border">|</span>
            <button onClick={() => router.push("/")} className="font-medium text-primary hover:underline">Homepage</button>
          </p>
        </div>
      </div>

    </div>
  )
}

export default function SignupPage() {
  return <SignupContent />
}
