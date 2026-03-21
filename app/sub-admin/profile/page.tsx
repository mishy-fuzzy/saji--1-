"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Settings, Lock, Palette, Bell, Eye, EyeOff } from "lucide-react"

export default function SubAdminProfilePage() {
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "appearance" | "notifications">("profile")
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "Mike SubAdmin",
    email: "mike.subadmin@saji.com",
    phone: "+254700000003",
    jobTitle: "Assistant Administrator",
    bio: "Managing users and overseeing basic platform operations.",
  })

  const [twoFAEnabled, setTwoFAEnabled] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)

  const handleSaveProfile = () => {
    alert("Profile changes saved")
  }

  const handleUpdatePassword = () => {
    alert("Password updated")
  }

  const handleSaveTheme = () => {
    alert("Theme preference saved")
  }

  const handleSavePreferences = () => {
    alert("Notification preferences saved")
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Sub-Admin Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your account settings and preferences</p>
        </div>

        {/* Profile Card */}
        <Card className="p-6 bg-white dark:bg-gray-800 border-0 rounded-xl shadow-sm mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
              MS
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mike SubAdmin</h2>
              <p className="text-gray-600 dark:text-gray-400">mike.subadmin@saji.com</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Role: Assistant Administrator</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                activeTab === "profile"
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                activeTab === "security"
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Lock className="w-4 h-4 inline mr-2" />
              Security
            </button>
            <button
              onClick={() => setActiveTab("appearance")}
              className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                activeTab === "appearance"
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Palette className="w-4 h-4 inline mr-2" />
              Appearance
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                activeTab === "notifications"
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Bell className="w-4 h-4 inline mr-2" />
              Notifications
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                  <Input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 px-3 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Job Title</label>
                  <Input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full h-24 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                />
              </div>
              <Button onClick={handleSaveProfile} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10 rounded-lg">
                Save Changes
              </Button>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Password Reset</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <Button onClick={handleUpdatePassword} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10 rounded-lg">
                Update Password
              </Button>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Two-Factor Authentication</h3>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-700 dark:text-gray-300">
                    2FA Status: {twoFAEnabled ? "Enabled" : "Disabled"}
                  </span>
                  <Button
                    onClick={() => setTwoFAEnabled(!twoFAEnabled)}
                    className={`${twoFAEnabled ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 hover:bg-gray-500"} text-white h-9`}
                  >
                    {twoFAEnabled ? "Disable" : "Enable"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Theme Preferences</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="p-4 border-2 border-gray-200 dark:border-gray-600 cursor-pointer hover:border-blue-500 transition-colors">
                    <p className="font-medium text-gray-900 dark:text-white">Light Mode</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Bright and clean interface</p>
                  </Card>
                  <Card className="p-4 border-2 border-blue-500 cursor-pointer">
                    <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Easy on the eyes (Current)</p>
                  </Card>
                </div>
              </div>
              <Button onClick={handleSaveTheme} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10 rounded-lg">
                Save Theme
              </Button>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Platform Notifications</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={() => setEmailNotifications(!emailNotifications)}
                      className="w-5 h-5"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Email notifications for user management</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                    <input
                      type="checkbox"
                      checked={pushNotifications}
                      onChange={() => setPushNotifications(!pushNotifications)}
                      className="w-5 h-5"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Push notifications for system alerts</span>
                  </label>
                </div>
              </div>
              <Button onClick={handleSavePreferences} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10 rounded-lg">
                Save Preferences
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
