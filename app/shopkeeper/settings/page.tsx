"use client"

import { useState } from "react"
import { 
  Bell, Lock, User, CreditCard, Shield, Eye, EyeOff,
  ChevronRight, Save, AlertCircle, CheckCircle2, Mail, Phone, MapPin
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ShopkeeperSettingsPage() {
  const [activeTab, setActiveTab] = useState("account")
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [settings, setSettings] = useState({
    shopName: "SAJI Shop Kenya",
    businessRegistration: "KES-12345-67890",
    contactEmail: "shop@sajishop.com",
    contactPhone: "+254 712 345 678",
    shopLocation: "Westlands, Nairobi",
    businessDescription: "Premium electronics and home appliances",
    businessCategory: "Electronics & Appliances",
    
    emailNotifications: true,
    smsNotifications: true,
    orderNotifications: true,
    reviewNotifications: true,
    promotionalEmails: false,
    pushNotifications: true,
    
    twoFactorAuth: true,
    loginAlerts: true,
    deviceManagement: true,
    apiKeys: true,
  })

  const handleSaveChanges = () => {
    setShowSaveSuccess(true)
    setTimeout(() => setShowSaveSuccess(false), 3000)
  }

  const handlePasswordChange = () => {
    alert("Password changed successfully!")
    setShowPasswordDialog(false)
  }

  const toggleSetting = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your shop preferences and security settings</p>
        </div>

        {showSaveSuccess && (
          <Card className="p-4 mb-6 border-0 shadow-lg bg-emerald-50 dark:bg-emerald-900/30 border-l-4 border-emerald-600">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-emerald-900 dark:text-emerald-100">Changes saved successfully!</p>
                <p className="text-sm text-emerald-800 dark:text-emerald-200">Your settings have been updated.</p>
              </div>
            </div>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <TabsTrigger value="account" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6 mt-6">
            <Card className="p-6 border-0 shadow-lg">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Shop Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Shop Name</label>
                  <Input 
                    value={settings.shopName}
                    onChange={(e) => setSettings({...settings, shopName: e.target.value})}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Business Registration</label>
                    <Input 
                      value={settings.businessRegistration}
                      onChange={(e) => setSettings({...settings, businessRegistration: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Business Category</label>
                    <select className="w-full px-3 py-2 border border-input rounded-md bg-background">
                      <option>Electronics & Appliances</option>
                      <option>Fashion & Clothing</option>
                      <option>Home & Garden</option>
                      <option>Sports & Outdoors</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Business Description</label>
                  <textarea 
                    value={settings.businessDescription}
                    onChange={(e) => setSettings({...settings, businessDescription: e.target.value})}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background resize-none h-20"
                  />
                </div>

                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Mail className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Email</p>
                        <Input 
                          value={settings.contactEmail}
                          onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                          className="mt-1 bg-white dark:bg-gray-700"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Phone className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <Input 
                          value={settings.contactPhone}
                          onChange={(e) => setSettings({...settings, contactPhone: e.target.value})}
                          className="mt-1 bg-white dark:bg-gray-700"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <MapPin className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Shop Location</p>
                        <Input 
                          value={settings.shopLocation}
                          onChange={(e) => setSettings({...settings, shopLocation: e.target.value})}
                          className="mt-1 bg-white dark:bg-gray-700"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" className="bg-transparent">Cancel</Button>
                <Button onClick={handleSaveChanges} className="bg-amber-600 hover:bg-amber-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6 mt-6">
            <Card className="p-6 border-0 shadow-lg">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Notification Preferences</h2>
              
              <div className="space-y-4">
                {[
                  { key: "emailNotifications", label: "Email Notifications", description: "Receive important updates via email" },
                  { key: "smsNotifications", label: "SMS Notifications", description: "Get alerts through text messages" },
                  { key: "orderNotifications", label: "Order Alerts", description: "Notify when new orders arrive" },
                  { key: "reviewNotifications", label: "Review Notifications", description: "Get notified of customer reviews" },
                  { key: "pushNotifications", label: "Push Notifications", description: "Enable app push notifications" },
                  { key: "promotionalEmails", label: "Promotional Content", description: "Receive promotional offers and updates" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <button
                      onClick={() => toggleSetting(item.key)}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                        settings[item.key as keyof typeof settings] ? "bg-amber-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          settings[item.key as keyof typeof settings] ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button onClick={handleSaveChanges} className="bg-amber-600 hover:bg-amber-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6 mt-6">
            <Card className="p-6 border-0 shadow-lg">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Security Settings</h2>
              
              <div className="space-y-4">
                <Button 
                  onClick={() => setShowPasswordDialog(true)}
                  className="w-full justify-between bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 h-auto py-4"
                >
                  <div className="flex items-center gap-3 text-left">
                    <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Change Password</p>
                      <p className="text-sm text-muted-foreground">Update your password regularly</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Button>

                {[
                  { key: "twoFactorAuth", label: "Two-Factor Authentication", description: "Add an extra layer of security" },
                  { key: "loginAlerts", label: "Login Alerts", description: "Get notified of login attempts" },
                  { key: "deviceManagement", label: "Device Management", description: "Manage trusted devices" },
                  { key: "apiKeys", label: "API Keys & Webhooks", description: "Manage API access tokens" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <button
                      onClick={() => toggleSetting(item.key)}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                        settings[item.key as keyof typeof settings] ? "bg-emerald-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          settings[item.key as keyof typeof settings] ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">Security Recommendation</p>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">Enable two-factor authentication to protect your account from unauthorized access.</p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6 mt-6">
            <Card className="p-6 border-0 shadow-lg">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Billing & Plans</h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-semibold text-amber-900 dark:text-amber-100">Premium Plan</p>
                      <p className="text-sm text-amber-800 dark:text-amber-200">Active until 15 Mar 2026</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-semibold">Active</span>
                  </div>
                  <Button className="w-full bg-amber-600 hover:bg-amber-700">Manage Plan</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-sm text-muted-foreground">Monthly Cost</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">KES 2,999</p>
                  </div>
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-sm text-muted-foreground">Next Billing</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">15 Mar 2026</p>
                  </div>
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">•••• 4242</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Plan Features</h3>
                  <div className="space-y-2">
                    {[
                      "Unlimited product listings",
                      "Advanced analytics & reports",
                      "Priority customer support",
                      "Marketing tools included",
                      "API access"
                    ].map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">Current Password</label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter current password"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">New Password</label>
              <Input type="password" placeholder="Enter new password" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <Input type="password" placeholder="Confirm new password" />
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowPasswordDialog(false)} className="flex-1 bg-transparent">Cancel</Button>
              <Button onClick={handlePasswordChange} className="flex-1 bg-amber-600 hover:bg-amber-700">Change Password</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
