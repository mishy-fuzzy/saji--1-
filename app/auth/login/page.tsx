"use client"

import React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthContext } from "@/lib/auth-context"
import { Mail, Lock, ArrowRight, Eye, EyeOff, Apple, Phone, CheckCircle2, Shield, Users, Zap } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { loginWithCredentials } from "@/lib/services/auth-service"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuthContext()
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [captchaText, setCaptchaText] = useState("")
  const [captchaInput, setCaptchaInput] = useState("")
  const [captchaVerified, setCaptchaVerified] = useState(false)

  React.useEffect(() => {
    const google = searchParams.get("google")
    const emailFromOAuth = searchParams.get("email")
    const nameFromOAuth = searchParams.get("name")

    if (google === "1" && emailFromOAuth) {
      const user = {
        id: "user_" + Date.now(),
        name: nameFromOAuth || emailFromOAuth.split("@")[0],
        email: emailFromOAuth,
        phone: "+254700000000",
        role: "customer" as UserRole,
        createdAt: new Date().toISOString(),
      }
      login(user)
      router.push("/customer/home")
    }
  }, [searchParams, login, router])

  const generateCaptcha = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCaptchaText(result)
  }

  React.useEffect(() => {
    generateCaptcha()
  }, [])

  const verifyCaptcha = () => {
    if (captchaInput.toUpperCase() === captchaText) {
      setCaptchaVerified(true)
      setCaptchaInput("")
    } else {
      setError("Incorrect CAPTCHA. Please try again.")
      setCaptchaInput("")
      generateCaptcha()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!captchaVerified) { setError("Please verify the CAPTCHA"); return }
    if (loginMethod === "email" ? !email || !password : !phone || !password) { setError("Please fill in all fields"); return }
    setIsLoading(true)

    try {
      const payload = await loginWithCredentials({
        email: loginMethod === "email" ? email : undefined,
        phone: loginMethod === "phone" ? phone : undefined,
        password,
      })

      login(payload.user)
      const routeRole = payload.routeRole || payload.user.role

      if (routeRole === "customer" || payload.user.role === "customer") router.push("/customer/home")
      else if (routeRole === "provider" || payload.user.role === "provider") router.push("/provider")
      else if (routeRole === "shopkeeper") router.push("/shopkeeper")
      else if (routeRole === "admin" || payload.user.role === "admin") router.push("/admin")
      else if (routeRole === "secretary" || payload.user.role === "secretary") router.push("/secretary")
      else if (routeRole === "sub-admin" || payload.user.role === "sub-admin") router.push("/sub-admin")
      else router.push("/customer/home")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google/start?mode=login"
  }

  const handleAppleLogin = () => {
    setIsLoading(true)
    setTimeout(() => {
      login({ id: "user_" + Date.now(), name: "Apple User", email: "user@icloud.com", phone: "+254700000000", role: "customer" as UserRole, createdAt: new Date().toISOString() })
      router.push("/customer/home")
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel -- desktop hero */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col justify-between relative overflow-hidden bg-primary text-primary-foreground p-10">
        {/* Decorative orbs */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-white/5 blur-3xl" />

        {/* Top */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
              <span className="text-lg font-bold">S</span>
            </div>
            <span className="text-xl font-bold tracking-tight">SAJI</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight mb-3">Welcome back</h1>
          <p className="text-white/70 text-sm leading-relaxed max-w-xs">Sign in to access your account and connect with trusted service professionals.</p>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-5">
          {[
            { icon: Shield, title: "Verified Professionals", desc: "All providers are thoroughly vetted" },
            { icon: Zap, title: "Instant Booking", desc: "Get matched and booked in minutes" },
            { icon: Users, title: "24/7 Support", desc: "Our team is always here to help" },
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

        {/* Footer */}
        <p className="relative z-10 text-white/40 text-xs">&copy; {new Date().getFullYear()} SAJI. All rights reserved.</p>
      </div>

      {/* Right Panel -- form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-8">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-base font-bold text-primary-foreground">S</span>
            </div>
            <span className="text-lg font-bold text-foreground">SAJI</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">Sign In</h2>
          <p className="text-sm text-muted-foreground mb-6">Access your SAJI account</p>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Method tabs */}
          <div className="flex rounded-xl bg-muted/50 p-1 mb-5">
            {(["email", "phone"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setLoginMethod(m); setCaptchaVerified(false) }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  loginMethod === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "email" ? <Mail className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                {m === "email" ? "Email" : "Phone"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Credential */}
            <div>
              <label htmlFor="credential" className="text-sm font-medium text-foreground mb-1.5 block">
                {loginMethod === "email" ? "Email Address" : "Phone Number"}
              </label>
              <div className="relative">
                {loginMethod === "email" ? (
                  <>
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="credential" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 h-10 rounded-xl border-border bg-card" disabled={isLoading} />
                  </>
                ) : (
                  <>
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="credential" type="tel" placeholder="+254700000000" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-9 h-10 rounded-xl border-border bg-card" disabled={isLoading} />
                  </>
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 pr-9 h-10 rounded-xl border-border bg-card" disabled={isLoading} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" disabled={isLoading}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* CAPTCHA */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Verify you{"'"}re human</label>
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <div className="flex items-center gap-2.5">
                  <div className="px-3 py-1.5 rounded-lg bg-card border border-border font-mono text-base font-bold text-primary tracking-[0.2em] select-none flex-shrink-0">
                    {captchaText}
                  </div>
                  <Input type="text" placeholder="Enter code" value={captchaInput} onChange={(e) => setCaptchaInput(e.target.value)} className="h-9 rounded-lg border-border bg-card text-sm flex-1" disabled={isLoading} maxLength={6} />
                  <Button type="button" onClick={verifyCaptcha} size="sm" variant="secondary" className="rounded-lg h-9 px-3 flex-shrink-0" disabled={isLoading || !captchaInput}>
                    Verify
                  </Button>
                </div>
                {captchaVerified && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> CAPTCHA verified successfully
                  </p>
                )}
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={rememberMe} onCheckedChange={setRememberMe} disabled={isLoading} />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <Link href="/auth/forgot-password" className="text-sm font-medium text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <Button type="submit" disabled={isLoading || !captchaVerified} className="w-full h-10 rounded-xl font-semibold gap-2">
              {isLoading ? "Signing in..." : "Sign In"}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">or continue with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Social */}
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" onClick={handleGoogleLogin} disabled={isLoading} variant="outline" className="h-10 rounded-xl bg-card gap-2 text-sm font-medium">
              <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.64-.15-3.21-.43-4.73H24v9.01h12.4c-.54 2.91-2.18 5.38-4.65 7.04l7.2 5.59c4.21-3.88 6.65-9.6 6.65-16.91z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.81l-7.2-5.59c-2 1.35-4.56 2.15-8.7 2.15-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              Google
            </Button>
            <Button type="button" onClick={handleAppleLogin} disabled={isLoading} className="h-10 rounded-xl gap-2 text-sm font-medium bg-foreground text-background hover:bg-foreground/90">
              <Apple className="w-4 h-4" />
              Apple
            </Button>
          </div>

          {/* Footer links */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            {"Don't have an account? "}
            <Link href="/auth/signup" className="font-semibold text-primary hover:underline">Sign up</Link>
            <span className="mx-2 text-border">|</span>
            <button onClick={() => router.push("/")} className="font-medium text-primary hover:underline">Homepage</button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <LoginContent />
}
