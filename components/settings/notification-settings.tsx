"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell } from "lucide-react"

export function NotificationSettings() {
  const [notifications, setNotifications] = useState({
    emailJobAlerts: true,
    emailMessages: true,
    emailPayments: true,
    emailPromos: false,
    pushJobAlerts: true,
    pushMessages: true,
    smsUrgent: true,
  })

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const notificationGroups = [
    {
      title: "Email Notifications",
      items: [
        { key: "emailJobAlerts", label: "Job alerts and offers" },
        { key: "emailMessages", label: "New messages from customers/providers" },
        { key: "emailPayments", label: "Payment confirmations and receipts" },
        { key: "emailPromos", label: "Special offers and promotions" },
      ],
    },
    {
      title: "Push Notifications",
      items: [
        { key: "pushJobAlerts", label: "Job updates and status changes" },
        { key: "pushMessages", label: "New messages" },
      ],
    },
    {
      title: "SMS Notifications",
      items: [{ key: "smsUrgent", label: "Urgent alerts only" }],
    },
  ]

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Preferences
        </h3>
        <p className="text-sm text-muted-foreground">Control how and when you receive notifications from SAJI</p>
      </div>

      <div className="space-y-8">
        {notificationGroups.map((group) => (
          <div key={group.title}>
            <h4 className="font-semibold text-foreground mb-4">{group.title}</h4>
            <div className="space-y-3">
              {group.items.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-4 border-2 border-border rounded-lg hover:border-primary/50 transition-colors"
                >
                  <Label className="cursor-pointer text-foreground">{item.label}</Label>
                  <Switch
                    checked={notifications[item.key as keyof typeof notifications]}
                    onCheckedChange={() => handleToggle(item.key as keyof typeof notifications)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Button className="rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold">
        Save Notification Settings
      </Button>
    </Card>
  )
}
