"use client"

import { useTheme } from "next-themes"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLocalization } from "@/lib/hooks/useLocalization"
import { LanguageSettings } from "./language-settings"
import { CurrencySettings } from "./currency-settings"
import { ThemeSettings } from "./theme-settings"
import { NotificationSettings } from "./notification-settings"
import { PrivacySettings } from "./privacy-settings"
import { Settings } from "lucide-react"

export function SettingsPage() {
  const { t } = useLocalization()
  const { theme } = useTheme()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Settings className="w-8 h-8" />
          {t("settings.title")}
        </h1>
        <p className="text-muted-foreground">Manage your SAJI account preferences and settings</p>
      </div>

      <Tabs defaultValue="appearance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="language">Language</TabsTrigger>
          <TabsTrigger value="currency">Currency</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <ThemeSettings />
        </TabsContent>

        {/* Language Tab */}
        <TabsContent value="language">
          <LanguageSettings />
        </TabsContent>

        {/* Currency Tab */}
        <TabsContent value="currency">
          <CurrencySettings />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy">
          <PrivacySettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
