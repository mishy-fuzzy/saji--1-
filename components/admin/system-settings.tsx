"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"

export function SystemSettings() {
  const [commissions, setCommissions] = useState({
    skilled: 15,
    semiSkilled: 10,
    nonSkilled: 8,
  })

  const [settings, setSettings] = useState({
    maintenanceMode: false,
    emailNotifications: true,
    smsNotifications: true,
    autoVerification: false,
  })

  return (
    <Tabs defaultValue="commissions" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="commissions">Commissions</TabsTrigger>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="payment">Payment</TabsTrigger>
      </TabsList>

      {/* Commissions Tab */}
      <TabsContent value="commissions" className="space-y-6">
        <Card className="p-6 space-y-6">
          <h3 className="font-semibold text-foreground text-lg">Commission Rates</h3>

          <div className="space-y-6">
            {[
              {
                label: "Skilled Services Commission",
                value: commissions.skilled,
                key: "skilled",
              },
              {
                label: "Semi-Skilled Services Commission",
                value: commissions.semiSkilled,
                key: "semiSkilled",
              },
              {
                label: "Non-Skilled Services Commission",
                value: commissions.nonSkilled,
                key: "nonSkilled",
              },
            ].map((item) => (
              <div key={item.key}>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base">{item.label}</Label>
                  <span className="text-2xl font-bold text-primary">{item.value}%</span>
                </div>
                <Slider
                  value={[item.value]}
                  onValueChange={(value) =>
                    setCommissions((prev) => ({
                      ...prev,
                      [item.key]: value[0],
                    }))
                  }
                  min={0}
                  max={50}
                  step={1}
                  className="w-full"
                />
              </div>
            ))}
          </div>

          <Button onClick={() => alert("Save commission rates")} className="rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold">
            Save Commission Rates
          </Button>
        </Card>
      </TabsContent>

      {/* General Tab */}
      <TabsContent value="general" className="space-y-6">
        <Card className="p-6 space-y-6">
          <h3 className="font-semibold text-foreground text-lg">General Settings</h3>

          <div className="space-y-4">
            {[
              { label: "Maintenance Mode", key: "maintenanceMode" },
              { label: "Email Notifications", key: "emailNotifications" },
              { label: "SMS Notifications", key: "smsNotifications" },
              { label: "Auto Verification", key: "autoVerification" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 border-2 border-border rounded-lg">
                <Label className="text-foreground">{item.label}</Label>
                <Switch
                  checked={settings[item.key as keyof typeof settings]}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      [item.key]: checked,
                    }))
                  }
                />
              </div>
            ))}
          </div>

          <Button onClick={() => alert("Save settings")} className="rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold">
            Save Settings
          </Button>
        </Card>
      </TabsContent>

      {/* Payment Tab */}
      <TabsContent value="payment" className="space-y-6">
        <Card className="p-6 space-y-6">
          <h3 className="font-semibold text-foreground text-lg">Payment Configuration</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Default Payout Method</Label>
              <Select defaultValue="mpesa">
                <SelectTrigger className="h-11 rounded-lg border-2 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Transaction Fee (%)</Label>
              <Input type="number" placeholder="2.5" className="h-11 rounded-lg border-2 border-border" />
            </div>

            <div className="space-y-2">
              <Label>Minimum Payout Amount (KES)</Label>
              <Input type="number" placeholder="500" className="h-11 rounded-lg border-2 border-border" />
            </div>

            <div className="space-y-2">
              <Label>Payout Schedule</Label>
              <Select defaultValue="daily">
                <SelectTrigger className="h-11 rounded-lg border-2 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instant">Instant</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={() => alert("Update payment settings")} className="rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold">
            Update Payment Settings
          </Button>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
