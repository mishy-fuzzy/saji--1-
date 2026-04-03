"use client"

import { useEffect, useState } from "react"
import { Camera, CheckCircle2, Edit, FileText, Globe, LocateFixed, Mail, MapPin, Phone, TrendingUp } from "lucide-react"
import Image from "next/image"

import { LoadingScreen } from "@/components/loading-screen"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuthContext } from "@/lib/auth-context"

type ShopkeeperProfile = {
  name: string
  email: string
  phone: string
  location: string
  website: string
  bio: string
  avatar: string
  joinDate: string
  activeProducts: number
  totalSales: string
  totalOrders: number
}

function formatMoney(value: number) {
  return `KES ${value.toLocaleString()}`
}

export default function ShopkeeperProfilePage() {
  const { user, isLoading } = useAuthContext()
  const [isEditing, setIsEditing] = useState(false)
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [locationMessage, setLocationMessage] = useState("")
  const [profile, setProfile] = useState<ShopkeeperProfile>({
    name: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    bio: "",
    avatar: "",
    joinDate: "",
    activeProducts: 0,
    totalSales: "KES 0",
    totalOrders: 0,
  })
  const [editForm, setEditForm] = useState(profile)

  useEffect(() => {
    if (!user) return

    const joinDate = user.createdAt
      ? new Date(user.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        })
      : ""

    const nextProfile: ShopkeeperProfile = {
      name: user.name || "Shopkeeper",
      email: user.email || "",
      phone: user.phone || "",
      location: "",
      website: "",
      bio: "",
      avatar: user.avatar || "",
      joinDate,
      activeProducts: 0,
      totalSales: "KES 0",
      totalOrders: 0,
    }

    setProfile(nextProfile)
    setEditForm(nextProfile)
  }, [user])

  useEffect(() => {
    if (!user?.id) return

    let cancelled = false

    const loadSummary = async () => {
      try {
        const [earningsResponse, ordersResponse, productsResponse] = await Promise.all([
          fetch("/api/shopkeeper/earnings", { cache: "no-store" }),
          fetch(`/api/shopkeeper/orders?providerId=${encodeURIComponent(user.id)}`, { cache: "no-store" }),
          fetch(`/api/shopkeeper/products?providerId=${encodeURIComponent(user.id)}`, { cache: "no-store" }),
        ])

        const [earningsPayload, ordersPayload, productsPayload] = await Promise.all([
          earningsResponse.json(),
          ordersResponse.json(),
          productsResponse.json(),
        ])

        if (cancelled) return

        const totalSales = earningsResponse.ok && earningsPayload?.ok
          ? Number(earningsPayload?.data?.totalEarnings || 0)
          : 0

        const orders = ordersResponse.ok && ordersPayload?.ok && Array.isArray(ordersPayload?.data)
          ? ordersPayload.data
          : []

        const products = productsResponse.ok && productsPayload?.ok && Array.isArray(productsPayload?.data)
          ? productsPayload.data
          : []

        const formattedSales = formatMoney(totalSales)

        setProfile((current) => ({
          ...current,
          totalSales: formattedSales,
          totalOrders: orders.length,
          activeProducts: products.length,
        }))
        setEditForm((current) => ({
          ...current,
          totalSales: formattedSales,
          totalOrders: orders.length,
          activeProducts: products.length,
        }))
      } catch {
        // Keep the profile usable even when summary requests fail.
      }
    }

    loadSummary()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return

    let cancelled = false

    const loadSavedLocation = async () => {
      try {
        const response = await fetch("/api/auth/location", { cache: "no-store" })
        const payload = await response.json()
        if (!response.ok || !payload?.ok || cancelled) return

        const location = String(payload?.data?.location || "")
        if (!location) return

        setProfile((current) => ({ ...current, location }))
        setEditForm((current) => ({ ...current, location }))
      } catch {
        // Keep page usable when location history is unavailable.
      }
    }

    loadSavedLocation()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  const stats = [
    { label: "Total Sales", value: profile.totalSales, icon: TrendingUp, color: "from-emerald-500 to-emerald-600" },
    { label: "Orders", value: profile.totalOrders, icon: FileText, color: "from-blue-500 to-blue-600" },
    { label: "Products", value: profile.activeProducts, icon: Camera, color: "from-purple-500 to-purple-600" },
    { label: "Joined", value: profile.joinDate || "Not set", icon: CheckCircle2, color: "from-amber-500 to-amber-600" },
  ]

  const handleSave = async () => {
    setProfile(editForm)
    if (editForm.location.trim()) {
      await fetch("/api/auth/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: editForm.location.trim(),
          latitude: 0,
          longitude: 0,
          accuracy: null,
        }),
      }).catch(() => {
        // Manual save should not block profile edits if location API fails.
      })
    }
    setIsEditing(false)
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

        setEditForm((current) => ({ ...current, location }))
        setProfile((current) => ({ ...current, location }))

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
          setLocationMessage(
            error instanceof Error ? error.message : "Failed to save location.",
          )
        } finally {
          setIsDetectingLocation(false)
        }
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Location permission denied."
            : "Unable to fetch location."
        setLocationMessage(message)
        setIsDetectingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Shop Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your shop information and account details</p>
        </div>

        <Card className="p-8 border-0 shadow-lg mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
            <div className="relative">
              {profile.avatar ? (
                <Image
                  src={profile.avatar}
                  alt={profile.name}
                  width={120}
                  height={120}
                  className="w-32 h-32 rounded-2xl object-cover border-4 border-amber-600"
                />
              ) : (
                <div className="w-32 h-32 rounded-2xl border-4 border-amber-600 bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-3xl font-bold text-amber-700 dark:text-amber-300">
                  {profile.name ? profile.name.charAt(0).toUpperCase() : "S"}
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-2 border-4 border-white dark:border-gray-900">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{profile.name}</h2>
                <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs px-3 py-1 rounded-full font-semibold">
                  Signed-in account
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {profile.bio || "Business details are synced from your signed-in account."}
              </p>
              <Button onClick={() => setIsEditing((current) => !current)} className="bg-amber-600 hover:bg-amber-700 gap-2">
                <Edit className="w-4 h-4" />
                {isEditing ? "Cancel" : "Edit Profile"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-gray-200 dark:border-gray-700">
            {stats.map((stat, idx) => {
              const Icon = stat.icon
              return (
                <div key={idx} className={`p-4 rounded-lg bg-gradient-to-br ${stat.color} text-white`}>
                  <Icon className="w-6 h-6 mb-2 opacity-80" />
                  <p className="text-sm opacity-90">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              )
            })}
          </div>
        </Card>

        {isEditing && (
          <Card className="p-8 border-0 shadow-lg mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Edit Profile Information</h3>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Shop Name</label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Email</label>
                  <Input
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    type="email"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Phone</label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    type="tel"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Location</label>
                  <Input
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full"
                    placeholder="Not set"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="bg-transparent"
                      onClick={detectAndSaveLocation}
                      disabled={isDetectingLocation}
                    >
                      <LocateFixed className="w-4 h-4 mr-2" />
                      {isDetectingLocation ? "Detecting..." : "Use Current Location"}
                    </Button>
                    {locationMessage && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">{locationMessage}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Website</label>
                <Input
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  className="w-full"
                  placeholder="Not set"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  placeholder="Not set"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1 bg-transparent">
                  Cancel
                </Button>
                <Button onClick={handleSave} className="flex-1 bg-amber-600 hover:bg-amber-700">
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="p-6 border-0 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-amber-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-amber-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{profile.phone || "Not set"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-amber-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{profile.location || "Not set"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-amber-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Website</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{profile.website || "Not set"}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Account Status</span>
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-semibold rounded-full">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Signed In</span>
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-semibold rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Session-backed
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Member Since</span>
                <span className="font-semibold text-gray-900 dark:text-white">{profile.joinDate || "Not set"}</span>
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" className="w-full bg-transparent">
                  View Verification Details
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6 border-0 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Snapshot</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <TrendingUp className="w-8 h-8 mb-2 text-emerald-600" />
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Sales</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{profile.totalSales}</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <FileText className="w-8 h-8 mb-2 text-blue-600" />
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Orders</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{profile.totalOrders}</p>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <Camera className="w-8 h-8 mb-2 text-purple-600" />
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Products</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{profile.activeProducts}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
