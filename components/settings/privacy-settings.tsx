"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Lock, Eye } from "lucide-react"

export function PrivacySettings() {
  const [privacy, setPrivacy] = useState({
    profilePublic: true,
    showLocation: true,
    allowMessages: true,
    dataCollection: true,
    analyticsTracking: false,
  })

  const handleToggle = (key: keyof typeof privacy) => {
    setPrivacy((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleSavePrivacySettings = () => {
    alert("Privacy settings saved")
  }

  const handleDownloadMyData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      privacy,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `privacy-data-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleClearCache = () => {
    if (typeof window !== "undefined") {
      localStorage.clear()
      sessionStorage.clear()
    }
    alert("Local cache and session data cleared")
  }

  const handleDeleteAccount = () => {
    const confirmed = window.confirm("Delete account permanently? This cannot be undone.")
    if (!confirmed) return
    alert("Account deletion request submitted")
  }

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Privacy & Security
        </h3>
        <p className="text-sm text-muted-foreground">Manage your privacy and data settings</p>
      </div>

      <div className="space-y-3">
        {[
          {
            key: "profilePublic",
            label: "Public Profile",
            description: "Allow other users to view your profile",
          },
          {
            key: "showLocation",
            label: "Share Location",
            description: "Show your location to customers for booking",
          },
          {
            key: "allowMessages",
            label: "Allow Direct Messages",
            description: "Accept messages from users not in your contacts",
          },
          {
            key: "dataCollection",
            label: "Data Collection",
            description: "Allow us to collect usage data to improve SAJI",
          },
          {
            key: "analyticsTracking",
            label: "Analytics Tracking",
            description: "Track your activities for personalization (optional)",
          },
        ].map((item) => (
          <div
            key={item.key}
            className="flex items-start justify-between p-4 border-2 border-border rounded-lg hover:border-primary/50 transition-colors"
          >
            <div className="flex-1">
              <Label className="text-foreground font-semibold block mb-1">{item.label}</Label>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <Switch
              checked={privacy[item.key as keyof typeof privacy]}
              onCheckedChange={() => handleToggle(item.key as keyof typeof privacy)}
              className="ml-4"
            />
          </div>
        ))}
      </div>

      {/* Data Management Section */}
      <div className="pt-6 border-t border-border space-y-4">
        <h4 className="font-semibold text-foreground flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Data Management
        </h4>

        <div className="space-y-2">
          <Button onClick={handleDownloadMyData} variant="outline" className="w-full border-2 bg-transparent rounded-lg h-11">
            Download My Data
          </Button>
          <p className="text-xs text-muted-foreground">Get a copy of all your data on SAJI</p>
        </div>

        <div className="space-y-2">
          <Button onClick={handleClearCache} variant="outline" className="w-full border-2 bg-transparent rounded-lg h-11">
            Clear Cache & Cookies
          </Button>
          <p className="text-xs text-muted-foreground">Free up space and reset app data</p>
        </div>

        <div className="space-y-2">
          <Button
            onClick={handleDeleteAccount}
            variant="outline"
            className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 rounded-lg h-11 bg-transparent border-2"
          >
            Delete My Account
          </Button>
          <p className="text-xs text-destructive/70">Permanently delete your SAJI account (irreversible)</p>
        </div>
      </div>

      <Button onClick={handleSavePrivacySettings} className="rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold">
        Save Privacy Settings
      </Button>
    </Card>
  )
}
