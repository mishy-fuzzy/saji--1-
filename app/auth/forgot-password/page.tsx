"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Mail, ArrowLeft, CheckCircle2, Lock, Eye, EyeOff } from "lucide-react"

function ForgotPasswordContent() {
  const router = useRouter()
  const [step, setStep] = useState<"email" | "code" | "reset" | "success">("email")
  const [email, setEmail] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [generatedCode, setGeneratedCode] = useState("")

  const generateCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedCode(code)
    console.log("[v0] Password reset code (demo):", code)
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email) {
      setError("Please enter your email address")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    setIsLoading(true)

    // Simulate sending reset code
    setTimeout(() => {
      generateCode()
      setStep("code")
      setIsLoading(false)
    }, 1500)
  }

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!verificationCode) {
      setError("Please enter the verification code")
      return
    }

    if (verificationCode.length !== 6) {
      setError("Verification code must be 6 digits")
      return
    }

    setIsLoading(true)

    // Simulate verifying code
    setTimeout(() => {
      if (verificationCode === generatedCode) {
        setStep("reset")
      } else {
        setError("Invalid verification code. Please try again.")
      }
      setIsLoading(false)
    }, 1000)
  }

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields")
      return
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)

    // Simulate resetting password
    setTimeout(() => {
      setStep("success")
      setIsLoading(false)
    }, 1500)
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-blue-50 to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md p-8 border border-gray-200 dark:border-gray-700 shadow-lg text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Password Reset Complete</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Your password has been successfully reset. You can now log in with your new password.
          </p>

          <Link href="/auth/login">
            <Button className="w-full h-11 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold">
              Back to Login
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-blue-50 to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md p-8 border border-gray-200 dark:border-gray-700 shadow-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 mb-4">
            <span className="text-2xl font-bold text-white">S</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Reset Password</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {step === "email" && "Enter your email to receive a reset code"}
            {step === "code" && "Enter the verification code sent to your email"}
            {step === "reset" && "Create a new secure password"}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex gap-2 mb-8">
          <div className={`flex-1 h-2 rounded-full ${step === "email" || step === "code" || step === "reset" ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"}`} />
          <div className={`flex-1 h-2 rounded-full ${step === "code" || step === "reset" ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"}`} />
          <div className={`flex-1 h-2 rounded-full ${step === "reset" ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"}`} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Email */}
        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 rounded-lg border-2 border-gray-200 dark:border-gray-700 focus-visible:border-blue-500"
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold disabled:opacity-50"
            >
              {isLoading ? "Sending Code..." : "Send Reset Code"}
            </Button>

            <Link href="/auth/login" className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 hover:underline font-medium text-sm">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </form>
        )}

        {/* Step 2: Verification Code */}
        {step === "code" && (
          <form onSubmit={handleCodeSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Verification Code
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                We sent a 6-digit code to {email}
              </p>
              <Input
                id="code"
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="h-11 rounded-lg border-2 border-gray-200 dark:border-gray-700 focus-visible:border-blue-500 text-center text-2xl font-mono tracking-widest"
                maxLength={6}
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => setStep("email")}
                disabled={isLoading}
                variant="outline"
                className="flex-1 h-11 rounded-lg border-2 bg-transparent"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 h-11 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold disabled:opacity-50"
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Reset Password */}
        {step === "reset" && (
          <form onSubmit={handleResetSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 rounded-lg border-2 border-gray-200 dark:border-gray-700 focus-visible:border-blue-500"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  disabled={isLoading}
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 rounded-lg border-2 border-gray-200 dark:border-gray-700 focus-visible:border-blue-500"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => setStep("code")}
                disabled={isLoading}
                variant="outline"
                className="flex-1 h-11 rounded-lg border-2 bg-transparent"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 h-11 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold disabled:opacity-50"
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordContent />
}
