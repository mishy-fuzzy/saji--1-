"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Shield, Globe, Moon } from "lucide-react"

export default function SubAdminSettingsPage() {
  const [notifications, setNotifications] = useState({ email: true, push: true, sms: false })
  const [theme, setTheme] = useState("system")

  const handlePasswordUpdate = () => {
    alert("Password update flow started")
  }

  const Toggle = ({ on, onChange }: { on: boolean; onChange: () => void }) => (
    <button onClick={onChange} className={`w-10 h-5 rounded-full transition-colors flex items-center ${on?"bg-blue-600 justify-end":"bg-gray-300 dark:bg-gray-600 justify-start"}`}>
      <span className="w-4 h-4 bg-white rounded-full mx-0.5 shadow" />
    </button>
  )

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage your preferences</p>
      </div>

      <Card className="p-4 border-0 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          <Bell className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Notifications</h2>
        </div>
        {[
          { key: "email" as const, label: "Email Notifications", desc: "Receive updates via email" },
          { key: "push" as const, label: "Push Notifications", desc: "Browser push notifications" },
          { key: "sms" as const, label: "SMS Alerts", desc: "Critical alerts via SMS" },
        ].map(n => (
          <div key={n.key} className="flex items-center justify-between py-1">
            <div><p className="text-sm font-medium text-gray-900 dark:text-white">{n.label}</p><p className="text-xs text-gray-500">{n.desc}</p></div>
            <Toggle on={notifications[n.key]} onChange={()=>setNotifications({...notifications, [n.key]: !notifications[n.key]})} />
          </div>
        ))}
      </Card>

      <Card className="p-4 border-0 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          <Moon className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Appearance</h2>
        </div>
        <div className="flex gap-2">
          {["light","dark","system"].map(t => (
            <button key={t} onClick={()=>setTheme(t)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${theme===t?"bg-blue-600 text-white":"bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>{t}</button>
          ))}
        </div>
      </Card>

      <Card className="p-4 border-0 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          <Shield className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Security</h2>
        </div>
        <div className="flex items-center justify-between">
          <div><p className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p><p className="text-xs text-gray-500">Add an extra layer of security</p></div>
          <Button size="sm" variant="outline" className="bg-transparent text-xs">Enable</Button>
        </div>
        <div className="flex items-center justify-between">
          <div><p className="text-sm font-medium text-gray-900 dark:text-white">Change Password</p><p className="text-xs text-gray-500">Update your password regularly</p></div>
          <Button size="sm" variant="outline" className="bg-transparent text-xs" onClick={handlePasswordUpdate}>Update</Button>
        </div>
      </Card>
    </div>
  )
}
