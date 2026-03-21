"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sun, Moon } from "lucide-react"

const themes = [
  {
    id: "light",
    name: "Light Mode",
    description: "Clean and bright interface for daytime use",
    icon: Sun,
    color: "bg-yellow-400",
  },
  {
    id: "dark",
    name: "Dark Mode",
    description: "Easy on the eyes for nighttime browsing",
    icon: Moon,
    color: "bg-gray-900",
  },
]

export function ThemeSettings() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Display Theme</h3>
        <p className="text-sm text-muted-foreground">Choose how SAJI appears on your device</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {themes.map((themeOption) => {
          const Icon = themeOption.icon
          const isSelected = theme === themeOption.id

          return (
            <div
              key={themeOption.id}
              onClick={() => setTheme(themeOption.id)}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-lg"
                  : "border-border hover:border-primary/50 hover:shadow-md"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <Icon className="w-8 h-8 text-primary" />
                {isSelected && <Badge className="bg-primary text-primary-foreground">Active</Badge>}
              </div>

              <h4 className="font-semibold text-foreground mb-1">{themeOption.name}</h4>
              <p className="text-xs text-muted-foreground">{themeOption.description}</p>

              {/* Preview */}
              <div className={`mt-4 h-16 rounded-lg ${themeOption.color}`} />
            </div>
          )
        })}
      </div>

      <Button className="rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold">
        Save Theme Preference
      </Button>
    </Card>
  )
}
