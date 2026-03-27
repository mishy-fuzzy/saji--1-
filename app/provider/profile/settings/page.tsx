"use client";

import {
  ArrowLeft,
  Volume2,
  Lock,
  Eye,
  Shield,
  Trash2,
  Download,
  Bell,
  Globe,
  DollarSign,
  LogOut,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useLocalization } from "@/lib/hooks/useLocalization";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function SettingsPage() {
  const { language, setLanguage, currency, setCurrency, theme, setTheme } =
    useLocalization();
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailAlerts: true,
    jobNotifications: true,
    soundEnabled: true,
    smsNotifications: false,
    marketingEmails: false,
  });
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showTwoFA, setShowTwoFA] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePasswordChange = () => {
    if (passwordData.new !== passwordData.confirm) {
      setPasswordError("Passwords do not match");
      return;
    }
    if (passwordData.new.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    alert("Password changed successfully!");
    setShowChangePassword(false);
    setPasswordData({ current: "", new: "", confirm: "" });
    setPasswordError("");
  };

  const handleExportData = () => {
    alert("Your data export will be sent to your email within 24 hours");
  };

  const handleSignOutAllDevices = () => {
    alert(
      "You have been signed out from all devices. You will be redirected to the login page.",
    );
    window.location.href = "/auth/login";
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText !== "DELETE") {
      alert("Please type DELETE to confirm account deletion");
      return;
    }
    alert(
      "Your account and all associated data have been permanently deleted.",
    );
    window.location.href = "/auth/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pb-24 lg:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white p-4 shadow-lg">
        <div className="flex items-center gap-4 max-w-4xl mx-auto">
          <Link
            href="/provider/profile"
            className="lg:hidden hover:bg-blue-500/50 p-2 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-blue-100 text-sm">
              Manage your account preferences and security
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-2xl mx-auto lg:max-w-4xl space-y-6 mt-6">
        {/* Appearance Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Eye className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Appearance
            </h2>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Theme Preference
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as "light" | "dark")}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium hover:border-purple-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              >
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium hover:border-purple-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              >
                <option value="en">English</option>
                <option value="es">Spanish (Español)</option>
                <option value="sw">Swahili (Kiswahili)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium hover:border-purple-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              >
                <option value="KES">KES (Kenyan Shilling)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="GBP">GBP (British Pound)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Notifications
            </h2>
          </div>
          <div className="space-y-3">
            {[
              {
                key: "pushNotifications",
                label: "Push Notifications",
                desc: "Get notified about new jobs and messages",
              },
              {
                key: "emailAlerts",
                label: "Email Alerts",
                desc: "Receive important updates via email",
              },
              {
                key: "jobNotifications",
                label: "Job Notifications",
                desc: "Alerts when matching jobs are posted",
              },
              {
                key: "smsNotifications",
                label: "SMS Notifications",
                desc: "Get urgent alerts via text message",
              },
              {
                key: "soundEnabled",
                label: "Sound Notifications",
                desc: "Play sound for incoming messages",
              },
              {
                key: "marketingEmails",
                label: "Marketing Emails",
                desc: "Tips, promotions, and platform updates",
              },
            ].map((setting) => (
              <div
                key={setting.key}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {setting.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {setting.desc}
                  </p>
                </div>
                <button
                  onClick={() =>
                    toggleSetting(setting.key as keyof typeof settings)
                  }
                  className={`flex-shrink-0 w-12 h-7 rounded-full transition-all ${
                    settings[setting.key as keyof typeof settings]
                      ? "bg-blue-600 shadow-lg shadow-blue-600/30"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <div
                    className={`w-6 h-6 bg-white rounded-full transition-transform shadow-md ${
                      settings[setting.key as keyof typeof settings]
                        ? "translate-x-5.5"
                        : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Lock className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Security
            </h2>
          </div>
          <div className="space-y-4">
            <button
              onClick={() => setShowChangePassword(true)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors border border-gray-200 dark:border-gray-700"
            >
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">
                  Change Password
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Update your password regularly for security
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            <button
              onClick={() => {
                setShowTwoFA(!twoFAEnabled);
                setTwoFAEnabled(!twoFAEnabled);
              }}
              className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors border border-gray-200 dark:border-gray-700"
            >
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">
                  Two-Factor Authentication
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {twoFAEnabled
                    ? "Enabled - Your account is secure"
                    : "Add extra security to your account"}
                </p>
              </div>
              <div
                className={`flex-shrink-0 w-12 h-7 rounded-full transition-all cursor-pointer ${
                  twoFAEnabled
                    ? "bg-green-600 shadow-lg shadow-green-600/30"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full transition-transform shadow-md ${
                    twoFAEnabled ? "translate-x-5.5" : "translate-x-0.5"
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Privacy & Data
            </h2>
          </div>
          <div className="space-y-3">
            <button
              onClick={handleExportData}
              className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors border border-gray-200 dark:border-gray-700"
            >
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">
                  Export My Data
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Download a copy of your account data
                </p>
              </div>
              <Download className="w-5 h-5 text-gray-400" />
            </button>
            <button
              onClick={() => setShowDeleteAccount(true)}
              className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors border border-red-200 dark:border-red-900/30"
            >
              <div className="text-left">
                <p className="font-medium text-red-700 dark:text-red-400">
                  Delete Account
                </p>
                <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                  Permanently delete your account and all data
                </p>
              </div>
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
            </button>
          </div>
        </div>

        {/* Session Management */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <LogOut className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Session
            </h2>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You're currently signed in from 1 device
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Last active: Just now
            </p>
          </div>
          <Button
            onClick={() => setShowSignOutConfirm(true)}
            className="w-full bg-amber-600 hover:bg-amber-700"
          >
            Sign Out All Devices
          </Button>
        </div>

        {/* About */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            About
          </h2>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex justify-between">
              <span>App Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>Last Updated</span>
              <span className="font-medium">January 2026</span>
            </div>
            <Link
              href="/terms"
              className="block text-blue-600 dark:text-blue-400 hover:underline"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="block text-blue-600 dark:text-blue-400 hover:underline"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current and new password to update your account
              security
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={passwordData.current}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, current: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                New Password
              </label>
              <input
                type="password"
                value={passwordData.new}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, new: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={passwordData.confirm}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirm: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="Confirm new password"
              />
            </div>
            {passwordError && (
              <p className="text-red-600 text-sm">{passwordError}</p>
            )}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowChangePassword(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePasswordChange}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Change Password
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Modal */}
      <Dialog open={showDeleteAccount} onOpenChange={setShowDeleteAccount}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All your data will be permanently
              deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg p-4 text-sm text-red-700 dark:text-red-400">
            Are you sure you want to delete your account? This will remove all
            your profile information, jobs, earnings history, and reviews.
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Type "DELETE" to confirm
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) =>
                setDeleteConfirmText(e.target.value.toUpperCase())
              }
              placeholder='Type "DELETE"'
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteAccount(false);
                setDeleteConfirmText("");
              }}
              className="flex-1 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== "DELETE"}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete Permanently
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sign Out All Devices Confirmation Modal */}
      <Dialog open={showSignOutConfirm} onOpenChange={setShowSignOutConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sign Out All Devices?</DialogTitle>
            <DialogDescription>
              You will be signed out from all devices and need to log in again.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-lg p-4 text-sm text-amber-700 dark:text-amber-400">
            This will end your session on all devices including this one. You
            will need to enter your credentials again.
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowSignOutConfirm(false)}
              className="flex-1 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSignOutAllDevices}
              className="flex-1 bg-amber-600 hover:bg-amber-700"
            >
              Sign Out All Devices
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
