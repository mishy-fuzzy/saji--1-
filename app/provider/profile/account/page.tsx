"use client"

import type React from "react"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowLeft, LocateFixed, Save, User, Mail, MapPin } from "lucide-react"
import Link from "next/link"
import { useLocalization } from "@/lib/hooks/useLocalization"
import { useAuthContext } from "@/lib/auth-context"
import { parseCoordinateLabel, resolveLocationName } from "@/lib/location"

export default function MyAccountPage() {
  const { currency } = useLocalization()
  const { user, login } = useAuthContext()
  const defaultNames = useMemo(() => {
    const fullName = user?.name?.trim() || ""
    const parts = fullName.split(" ").filter(Boolean)
    return {
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" ") || "",
    }
  }, [user?.name])

  const [formData, setFormData] = useState({
    firstName: defaultNames.firstName,
    lastName: defaultNames.lastName,
    email: user?.email || "",
    phone: user?.phone || "",
    city: "Nairobi",
    country: "Kenya",
  })

  const [isSaving, setIsSaving] = useState(false)
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [locationMessage, setLocationMessage] = useState("")
  const [hasSavedLocation, setHasSavedLocation] = useState<boolean | null>(null)
  const [autoLocationAttempted, setAutoLocationAttempted] = useState(false)
  const [locationUpdatedAt, setLocationUpdatedAt] = useState<string | null>(null)
  const [showEmailVerificationPrompt, setShowEmailVerificationPrompt] = useState(false)
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null)
  const [verificationMessage, setVerificationMessage] = useState("")
  const [verificationBusy, setVerificationBusy] = useState<"request" | "confirm" | null>(null)
  const [verificationRequested, setVerificationRequested] = useState(false)
  const [emailCode, setEmailCode] = useState("")

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      firstName: defaultNames.firstName,
      lastName: defaultNames.lastName,
      email: user?.email || "",
      phone: user?.phone || "",
    }))
  }, [defaultNames.firstName, defaultNames.lastName, user?.email, user?.phone])

  useEffect(() => {
    setEmailVerified(
      typeof user?.emailVerified === "boolean" ? user.emailVerified : null,
    )
  }, [user?.emailVerified])

  useEffect(() => {
    if (!user?.email) {
      setShowEmailVerificationPrompt(false)
      return
    }

    if (emailVerified === null) return
    setShowEmailVerificationPrompt(!emailVerified)
  }, [emailVerified, user?.email])

  useEffect(() => {
    if (!user?.id) return

    let cancelled = false

    const loadSavedLocation = async () => {
      try {
        const response = await fetch("/api/auth/location", { cache: "no-store" })
        const payload = await response.json()
        if (!response.ok || !payload?.ok || cancelled) return

        const rawLocation = String(payload?.data?.location || "")
        const updatedAt = payload?.data?.updatedAt
        const payloadLatitude = Number(payload?.data?.latitude)
        const payloadLongitude = Number(payload?.data?.longitude)
        const payloadAccuracy =
          typeof payload?.data?.accuracy === "number"
            ? payload.data.accuracy
            : null
        const parsedCoords = parseCoordinateLabel(rawLocation)
        const latitude = Number.isFinite(payloadLatitude)
          ? payloadLatitude
          : parsedCoords?.latitude
        const longitude = Number.isFinite(payloadLongitude)
          ? payloadLongitude
          : parsedCoords?.longitude

        let resolvedLocation = rawLocation
        if (
          (!resolvedLocation || parsedCoords) &&
          Number.isFinite(latitude) &&
          Number.isFinite(longitude)
        ) {
          const name = await resolveLocationName(latitude, longitude)
          if (name) {
            resolvedLocation = name
            void fetch("/api/auth/location", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                location: name,
                latitude,
                longitude,
                accuracy: payloadAccuracy,
              }),
            })
          }
        }

        if (!resolvedLocation) {
          if (!cancelled) {
            setHasSavedLocation(false)
            setLocationUpdatedAt(updatedAt ? new Date(updatedAt).toISOString() : null)
          }
          return
        }

        setFormData((prev) => ({ ...prev, city: resolvedLocation }))
        setHasSavedLocation(true)
        setLocationUpdatedAt(updatedAt ? new Date(updatedAt).toISOString() : null)
      } catch {
        // Keep account page usable when location history is unavailable.
        if (!cancelled) setHasSavedLocation(false)
      }
    }

    loadSavedLocation()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)

    const fullName = [formData.firstName, formData.lastName]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(" ")

    const updates: { name?: string; phone?: string; email?: string } = {}
    if (fullName && fullName !== (user?.name || "")) {
      updates.name = fullName
    }

    if (formData.phone.trim() !== (user?.phone || "")) {
      updates.phone = formData.phone.trim()
    }

    if (formData.email.trim() && formData.email.trim() !== (user?.email || "")) {
      updates.email = formData.email.trim()
    }

    const emailChanged = Boolean(updates.email)

    try {
      if (Object.keys(updates).length > 0) {
        const response = await fetch("/api/auth/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        })
        const payload = await response.json().catch(() => ({}))

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || "Failed to update profile")
        }

        if (user && payload?.data) {
          login({ ...user, ...payload.data })
        }

        if (emailChanged) {
          setEmailVerified(false)
          setVerificationRequested(false)
          setVerificationMessage("Email updated. Please verify to keep your account trusted.")
          setEmailCode("")
          setShowEmailVerificationPrompt(true)
        }
      }

      if (formData.city.trim()) {
        await fetch("/api/auth/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: formData.city.trim(),
            latitude: 0,
            longitude: 0,
            accuracy: null,
          }),
        }).catch(() => {
          // Keep manual profile save non-blocking.
        })
      }

      alert("Profile updated successfully!")
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const detectAndSaveLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationMessage("Geolocation is not supported in this browser.")
      return
    }

    setIsDetectingLocation(true)
    setLocationMessage("Fetching your current location...")

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = Number(position.coords.latitude.toFixed(6))
        const longitude = Number(position.coords.longitude.toFixed(6))
        const accuracy = Number(position.coords.accuracy.toFixed(0))
        const resolvedName = await resolveLocationName(latitude, longitude)
        const location = resolvedName || `${latitude}, ${longitude}`

        setFormData((prev) => ({ ...prev, city: location }))

        try {
          const response = await fetch("/api/auth/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ location, latitude, longitude, accuracy }),
          })
          const payload = await response.json()
          if (!response.ok || !payload?.ok) {
            throw new Error(payload?.error || "Failed to save location")
          }
          setLocationMessage("Location captured and saved.")
          if (payload?.data?.updatedAt) {
            setLocationUpdatedAt(new Date(payload.data.updatedAt).toISOString())
          } else {
            setLocationUpdatedAt(new Date().toISOString())
          }
        } catch (error) {
          setLocationMessage(error instanceof Error ? error.message : "Failed to save location.")
        } finally {
          setIsDetectingLocation(false)
        }
      },
      () => {
        setLocationMessage("Unable to fetch location.")
        setIsDetectingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }, [])

  const requestEmailVerification = async () => {
    if (!formData.email.trim()) return

    setVerificationBusy("request")
    setVerificationMessage("")
    try {
      const response = await fetch("/api/users/verify/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "email" }),
      })
      const payload = await response.json()

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Failed to request verification code")
      }

      setVerificationRequested(true)
      const devCode = String(payload?.data?.devCode || "").trim()
      setVerificationMessage(
        devCode
          ? `Code sent. Dev OTP: ${devCode}`
          : "Verification code sent to your email.",
      )
    } catch (error) {
      setVerificationMessage(
        error instanceof Error ? error.message : "Failed to request verification code",
      )
    } finally {
      setVerificationBusy(null)
    }
  }

  const confirmEmailVerification = async () => {
    const code = emailCode.trim()
    if (!/^\d{6}$/.test(code)) {
      setVerificationMessage("Enter a valid 6-digit code.")
      return
    }

    setVerificationBusy("confirm")
    setVerificationMessage("")
    try {
      const response = await fetch("/api/users/verify/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "email", code }),
      })
      const payload = await response.json()

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Failed to verify code")
      }

      const refresh = await fetch("/api/auth/me", { cache: "no-store" })
      const refreshed = await refresh.json().catch(() => ({}))
      if (refresh.ok && refreshed?.ok && refreshed?.data && user) {
        login({ ...user, ...refreshed.data })
        if (typeof refreshed.data.emailVerified === "boolean") {
          setEmailVerified(refreshed.data.emailVerified)
        }
      }

      setEmailCode("")
      setVerificationRequested(false)
      setVerificationMessage("Email verified successfully.")
      setEmailVerified(true)
      setShowEmailVerificationPrompt(false)
    } catch (error) {
      setVerificationMessage(
        error instanceof Error ? error.message : "Failed to verify code",
      )
    } finally {
      setVerificationBusy(null)
    }
  }

  const refreshAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload?.ok || !payload?.data || !user) return

      const next = payload.data as typeof user
      const nextEmailVerified =
        typeof (next as { emailVerified?: boolean }).emailVerified === "boolean"
          ? (next as { emailVerified: boolean }).emailVerified
          : null

      setEmailVerified(nextEmailVerified)

      const shouldUpdate =
        next.name !== user.name ||
        next.email !== user.email ||
        next.phone !== user.phone ||
        next.role !== user.role ||
        next.avatar !== user.avatar ||
        (next as { emailVerified?: boolean }).emailVerified !== user.emailVerified

      if (shouldUpdate) {
        login({ ...user, ...next })
      }
    } catch {
      // Keep UI responsive if auth refresh fails.
    }
  }, [login, user])

  useEffect(() => {
    if (!user?.id) return
    refreshAuth()
  }, [refreshAuth, user?.id])

  useEffect(() => {
    if (!user?.id) return
    if (autoLocationAttempted || isDetectingLocation) return
    if (hasSavedLocation === null) return

    const cityValue = formData.city.trim()
    const shouldAutoDetect =
      !cityValue ||
      cityValue.toLowerCase() === "nairobi" ||
      hasSavedLocation === false

    if (!shouldAutoDetect) return

    setAutoLocationAttempted(true)
    detectAndSaveLocation()
  }, [
    autoLocationAttempted,
    detectAndSaveLocation,
    formData.city,
    hasSavedLocation,
    isDetectingLocation,
    user?.id,
  ])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 lg:pb-0">
      {/* Header */}
      <div className="bg-blue-600 dark:bg-blue-700 text-white p-4 rounded-b-2xl lg:rounded-none">
        <div className="flex items-center gap-4 max-w-4xl mx-auto">
          <Link href="/provider/profile" className="lg:hidden">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold">My Account</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-2xl mx-auto lg:max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border dark:border-gray-700 space-y-6">
          {/* Personal Information */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Contact Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                {emailVerified === true && (
                  <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    Verified
                  </p>
                )}
                {emailVerified === false && !showEmailVerificationPrompt && (
                  <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                    Not verified
                  </p>
                )}
                {showEmailVerificationPrompt && (
                  <div className="mt-3 rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-900 dark:text-amber-200">
                    <p className="font-semibold">Verify your email</p>
                    <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                      Keep your account trusted by confirming the new email address.
                    </p>
                    {verificationMessage && (
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                        {verificationMessage}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={requestEmailVerification}
                        disabled={verificationBusy !== null}
                        className="px-3 py-2 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-70"
                      >
                        {verificationBusy === "request" ? "Sending..." : verificationRequested ? "Resend Code" : "Send Code"}
                      </button>
                      <input
                        value={emailCode}
                        onChange={(event) =>
                          setEmailCode(
                            event.target.value.replace(/\D/g, "").slice(0, 6),
                          )
                        }
                        placeholder="6-digit code"
                        className="h-9 w-32 rounded-lg border border-amber-200 dark:border-amber-900/40 bg-white dark:bg-gray-800 px-2 text-xs text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={confirmEmailVerification}
                        disabled={verificationBusy !== null}
                        className="px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70"
                      >
                        {verificationBusy === "confirm" ? "Verifying..." : "Verify"}
                      </button>
                      <Link
                        href="/provider/profile/verification"
                        className="px-3 py-2 rounded-lg text-xs font-semibold border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                      >
                        Open Verification Page
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Location
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 inline-flex items-center"
                    onClick={detectAndSaveLocation}
                    disabled={isDetectingLocation}
                  >
                    <LocateFixed className="w-4 h-4 mr-2" />
                    {isDetectingLocation ? "Detecting..." : "Use Current Location"}
                  </button>
                  {locationMessage && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">{locationMessage}</p>
                  )}
                  {locationUpdatedAt && !locationMessage && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Last updated {new Date(locationUpdatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  )
}
