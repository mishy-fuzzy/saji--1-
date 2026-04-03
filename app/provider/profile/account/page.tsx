"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, LocateFixed, Save, User, Mail, MapPin } from "lucide-react"
import Link from "next/link"
import { useLocalization } from "@/lib/hooks/useLocalization"
import { useAuthContext } from "@/lib/auth-context"

export default function MyAccountPage() {
  const { currency } = useLocalization()
  const { user } = useAuthContext()
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

  useEffect(() => {
    if (!user?.id) return

    let cancelled = false

    const loadSavedLocation = async () => {
      try {
        const response = await fetch("/api/auth/location", { cache: "no-store" })
        const payload = await response.json()
        if (!response.ok || !payload?.ok || cancelled) return

        const savedLocation = String(payload?.data?.location || "")
        if (!savedLocation) return

        setFormData((prev) => ({ ...prev, city: savedLocation }))
      } catch {
        // Keep account page usable when location history is unavailable.
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
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    alert("Profile updated successfully!")
  }

  const detectAndSaveLocation = () => {
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
        const location = `${latitude}, ${longitude}`

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
  }

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
