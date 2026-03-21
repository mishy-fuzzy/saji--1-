"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Mail, CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setLoading(false)
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <div className="p-8">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>

          {!submitted ? (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
              <p className="text-gray-600 mb-8">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 h-11"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>

              <p className="text-center text-gray-600 text-sm mt-6">
                Remember your password?{" "}
                <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Sign In
                </Link>
              </p>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Check Your Email</h1>
              <p className="text-gray-600 text-center mb-6">
                We've sent a password reset link to <span className="font-semibold">{email}</span>. Click the link in
                the email to reset your password.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Tip:</span> The link will expire in 24 hours. If you don't receive the
                  email, check your spam folder.
                </p>
              </div>

              <Button
                onClick={() => setSubmitted(false)}
                variant="outline"
                className="w-full border-2 border-gray-300 text-gray-900 font-semibold py-2.5 h-11"
              >
                Back to Login
              </Button>

              <p className="text-center text-gray-600 text-sm mt-6">
                Didn't work?{" "}
                <button
                  onClick={() => {
                    setSubmitted(false)
                    setEmail("")
                  }}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Try Again
                </button>
              </p>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
