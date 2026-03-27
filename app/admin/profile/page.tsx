"use client";

import { useState } from "react";
import {
  User,
  Lock,
  Palette,
  Bell,
  Eye,
  EyeOff,
  Save,
  LogOut,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    fullName: "Sarah Mitchell",
    email: "sarah@example.com",
    phone: "+254 700 000000",
    country: "Kenya",
    jobTitle: "Administrator",
    avatar: "SM",
  });

  const [appearance, setAppearance] = useState({
    darkMode: "light",
  });

  const [notifications, setNotifications] = useState({
    jobEmail: true,
    jobPush: true,
    newJobs: true,
    disputes: true,
    completedJobs: true,
    paymentEmail: true,
    paymentPush: true,
    paymentsReleased: true,
    deposits: true,
    refunds: true,
  });

  const handleSaveProfile = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChangeAvatar = () => {
    console.log("Change avatar clicked");
    alert("Avatar upload functionality would be implemented here");
  };

  const handleUpdatePassword = () => {
    console.log("Update password clicked");
    alert("Password update functionality would be implemented here");
  };

  const handleManage2FA = () => {
    console.log("Manage 2FA clicked");
    alert("2FA management functionality would be implemented here");
  };

  const handleLogoutAllDevices = () => {
    console.log("Logout from all devices clicked");
    alert("This will logout your account from all devices");
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your account preferences and security
        </p>
      </div>

      {/* Profile Card */}
      <Card className="border-0 shadow-lg p-6 md:p-8">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {profile.avatar}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.fullName}
              </h2>
              <CheckCircle2 size={20} className="text-emerald-500" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">{profile.email}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              {profile.jobTitle} • {profile.country}
            </p>
          </div>
          <Button
            onClick={handleChangeAvatar}
            className="bg-blue-600 hover:bg-blue-700 gap-2 hidden sm:flex"
          >
            <Upload size={18} />
            Change Avatar
          </Button>
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={(e) =>
                      setProfile({ ...profile, fullName: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 dark:text-gray-400 text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Cannot be changed
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Country
                  </label>
                  <select className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                    <option value="Kenya">Kenya</option>
                    <option value="Uganda">Uganda</option>
                    <option value="Tanzania">Tanzania</option>
                    <option value="Rwanda">Rwanda</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSaveProfile}
                className="bg-blue-600 hover:bg-blue-700 gap-2"
              >
                <Save size={18} />
                Save Changes
              </Button>
              {saved && (
                <div className="flex items-center gap-2 text-emerald-600 font-medium">
                  <CheckCircle2 size={18} />
                  Saved successfully
                </div>
              )}
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="space-y-8">
            {/* Password Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Change Password
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Update your password to keep your account secure
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleUpdatePassword}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Update Password
                </Button>
              </div>
            </div>

            {/* 2FA Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Two-Factor Authentication
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-7 bg-emerald-600 rounded-full flex items-center px-1 cursor-pointer">
                    <div className="w-5 h-5 bg-white rounded-full ml-auto" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enabled
                  </span>
                </div>
              </div>
              <Button
                onClick={handleManage2FA}
                className="mt-4 bg-blue-600 hover:bg-blue-700"
              >
                Manage 2FA
              </Button>
            </div>

            {/* Sessions Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Active Sessions
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                  <div className="text-sm">
                    <p className="font-medium text-gray-900 dark:text-white">
                      Chrome on macOS
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                      Last active now
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded">
                    Current
                  </span>
                </div>
              </div>
              <Button
                onClick={handleLogoutAllDevices}
                variant="outline"
                className="mt-4 bg-transparent text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 gap-2"
              >
                <LogOut size={18} />
                Logout from All Devices
              </Button>
            </div>
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === "appearance" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Theme Preference
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    id: "light",
                    label: "Light",
                    icon: "☀️",
                    desc: "Light mode",
                  },
                  { id: "dark", label: "Dark", icon: "🌙", desc: "Dark mode" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() =>
                      setAppearance({ ...appearance, darkMode: mode.id })
                    }
                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-3 ${
                      appearance.darkMode === mode.id
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
                    }`}
                  >
                    <span className="text-2xl">{mode.icon}</span>
                    <div className="text-center">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {mode.label}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {mode.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSaveProfile}
                className="bg-blue-600 hover:bg-blue-700 gap-2"
              >
                <Save size={18} />
                Save Preferences
              </Button>
              {saved && (
                <div className="flex items-center gap-2 text-emerald-600 font-medium">
                  <CheckCircle2 size={18} />
                  Saved successfully
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            {/* Email & Push */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Communication Preferences
              </h3>
              <div className="space-y-3">
                {[
                  {
                    id: "jobEmail",
                    label: "Email notifications for job activities",
                  },
                  {
                    id: "jobPush",
                    label: "Push notifications for job activities",
                  },
                ].map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={
                        notifications[item.id as keyof typeof notifications]
                      }
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          [item.id]: e.target.checked,
                        })
                      }
                      className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Job Events */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Job Events
              </h3>
              <div className="space-y-3">
                {[
                  {
                    id: "newJobs",
                    label: "New job submissions",
                    desc: "Get notified when new jobs are posted",
                  },
                  {
                    id: "disputes",
                    label: "Dispute notifications",
                    desc: "Alert when disputes are raised",
                  },
                  {
                    id: "completedJobs",
                    label: "Completed jobs",
                    desc: "Jobs awaiting verification",
                  },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={
                        notifications[item.id as keyof typeof notifications]
                      }
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          [item.id]: e.target.checked,
                        })
                      }
                      className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer mt-0.5"
                    />
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white font-medium">
                        {item.label}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Events */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Payment Events
              </h3>
              <div className="space-y-3">
                {[
                  {
                    id: "paymentEmail",
                    label: "Email notifications for payments",
                  },
                  {
                    id: "paymentPush",
                    label: "Push notifications for payments",
                  },
                  {
                    id: "paymentsReleased",
                    label: "Payments released",
                    desc: "When funds are released from escrow",
                  },
                  {
                    id: "deposits",
                    label: "Deposit notifications",
                    desc: "Deposit and balance installments",
                  },
                  {
                    id: "refunds",
                    label: "Refund notifications",
                    desc: "Refunds requested by parties",
                  },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={
                        notifications[item.id as keyof typeof notifications]
                      }
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          [item.id]: e.target.checked,
                        })
                      }
                      className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer mt-0.5"
                    />
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white font-medium">
                        {item.label}
                      </p>
                      {item.desc && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.desc}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSaveProfile}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Save size={18} />
              Save Notification Settings
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
