"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLocalization } from "@/lib/hooks/useLocalization"
import { useAuthContext } from "@/lib/auth-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { 
  Sun, Moon, Bell, Shield, CreditCard, HelpCircle, LogOut, 
  ChevronRight, User, Lock, Eye, EyeOff, Smartphone, Globe,
  FileText, Trash2, Download, CheckCircle, MessageCircle, Settings,
  AlertTriangle, Loader2, Database, Clock, FileArchive
} from "lucide-react"
import Image from "next/image"
import type { Language, CurrencyCode } from "@/lib/types"

export function CustomerSettingsPage() {
  const router = useRouter()
  const { language, setLanguage, currency, setCurrency, theme, setTheme } = useLocalization()
  const { user, logout } = useAuthContext()
  const [activeSection, setActiveSection] = useState("account")
  const [showPassword, setShowPassword] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState({
    jobUpdates: true, messages: true, payments: true, promotions: false, emailDigest: true, pushNotifications: true,
  })

  // Privacy / Download / Delete state
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadReady, setDownloadReady] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteStep, setDeleteStep] = useState(1)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [deleteReason, setDeleteReason] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDownloadData = () => {
    setIsDownloading(true)
    setDownloadProgress(0)
    setDownloadReady(false)
    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) { clearInterval(interval); setIsDownloading(false); setDownloadReady(true); return 100 }
        return prev + Math.random() * 15
      })
    }, 400)
  }

  const handleDeleteAccount = () => {
    setIsDeleting(true)
    setTimeout(() => { setIsDeleting(false); setShowDeleteModal(false); logout(); router.push("/") }, 3000)
  }

  const settingsSections = [
    { id: "account", label: "Account", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Sun },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "payment", label: "Payment", icon: CreditCard },
    { id: "privacy", label: "Privacy", icon: Lock },
    { id: "help", label: "Help & Support", icon: HelpCircle },
  ]

  const languages = [
    { code: "en", name: "English", flag: "GB" },
    { code: "sw", name: "Kiswahili", flag: "KE" },
    { code: "fr", name: "Francais", flag: "FR" },
  ]

  const currencies = [
    { code: "KES", symbol: "KES", name: "Kenyan Shilling", region: "Kenya" },
    { code: "USD", symbol: "$", name: "US Dollar", region: "United States" },
    { code: "EUR", symbol: "E", name: "Euro", region: "Europe" },
    { code: "GBP", symbol: "P", name: "British Pound", region: "United Kingdom" },
  ]

  const themes = [
    { id: "light", name: "Light", icon: Sun, desc: "Classic light theme" },
    { id: "dark", name: "Dark", icon: Moon, desc: "Easy on the eyes" },
  ]

  const handleLogout = () => { logout(); router.push("/") }

  const handleSaveProfile = () => {
    alert("Profile changes saved")
  }

  const handleUpdatePassword = () => {
    alert("Password updated")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-5 h-5 text-primary" />
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Settings</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-56 flex-shrink-0">
            <Card className="border-0 shadow-sm overflow-hidden sticky top-20">
              <nav className="p-1.5">
                {settingsSections.map((section) => {
                  const Icon = section.icon
                  return (
                    <button key={section.id} onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        activeSection === section.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {section.label}
                    </button>
                  )
                })}
                <hr className="my-2 border-border/50 mx-3" />
                <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                  <LogOut className="w-4 h-4" /> Log Out
                </button>
              </nav>
            </Card>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-4">
            {/* Account */}
            {activeSection === "account" && (
              <>
                <Card className="p-5 border-0 shadow-sm">
                  <h3 className="font-semibold text-foreground mb-4">Profile Information</h3>
                  <div className="flex flex-col sm:flex-row items-start gap-5">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-muted overflow-hidden">
                        <Image src={user?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"} alt="Profile" width={80} height={80} className="object-cover" />
                      </div>
                      <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary text-primary-foreground rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm">
                        <User className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex-1 space-y-3 w-full">
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Full Name</label><Input defaultValue={user?.name || "John Doe"} className="rounded-xl" /></div>
                        <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label><Input defaultValue={user?.email || "john@example.com"} className="rounded-xl" /></div>
                        <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Phone</label><Input defaultValue="+254 700 123 456" className="rounded-xl" /></div>
                        <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Location</label><Input defaultValue="Nairobi, Kenya" className="rounded-xl" /></div>
                      </div>
                      <Button onClick={handleSaveProfile} className="rounded-xl" size="sm">Save Changes</Button>
                    </div>
                  </div>
                </Card>

                <Card className="p-5 border-0 shadow-sm">
                  <h3 className="font-semibold text-foreground mb-4">Language & Region</h3>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">Language</label>
                      <div className="space-y-1.5">
                        {languages.map((lang) => (
                          <button key={lang.code} onClick={() => setLanguage(lang.code as Language)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${language === lang.code ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-7 h-5 bg-muted rounded text-[10px] font-bold flex items-center justify-center text-muted-foreground">{lang.flag}</span>
                              <span className="font-medium text-sm text-foreground">{lang.name}</span>
                            </div>
                            {language === lang.code && <CheckCircle className="w-4 h-4 text-primary" />}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">Currency</label>
                      <div className="space-y-1.5">
                        {currencies.map((curr) => (
                          <button key={curr.code} onClick={() => setCurrency(curr.code as CurrencyCode)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${currency === curr.code ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                          >
                            <div className="text-left">
                              <p className="font-medium text-sm text-foreground">{curr.symbol} {curr.code}</p>
                              <p className="text-[11px] text-muted-foreground">{curr.name}</p>
                            </div>
                            {currency === curr.code && <CheckCircle className="w-4 h-4 text-primary" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </>
            )}

            {/* Security */}
            {activeSection === "security" && (
              <>
                <Card className="p-5 border-0 shadow-sm">
                  <h3 className="font-semibold text-foreground mb-4">Change Password</h3>
                  <div className="space-y-3 max-w-md">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Current Password</label>
                      <div className="relative">
                        <Input type={showPassword ? "text" : "password"} placeholder="Enter current password" className="rounded-xl pr-10" />
                        <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">New Password</label><Input type="password" placeholder="Enter new password" className="rounded-xl" /></div>
                    <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Confirm New Password</label><Input type="password" placeholder="Confirm new password" className="rounded-xl" /></div>
                    <Button onClick={handleUpdatePassword} className="rounded-xl" size="sm">Update Password</Button>
                  </div>
                </Card>

                <Card className="p-5 border-0 shadow-sm">
                  <h3 className="font-semibold text-foreground mb-4">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center"><Smartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>
                      <div><p className="font-medium text-sm text-foreground">SMS Authentication</p><p className="text-xs text-muted-foreground">Receive codes via SMS</p></div>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl bg-transparent">Enable</Button>
                  </div>
                </Card>

                <Card className="p-5 border-0 shadow-sm">
                  <h3 className="font-semibold text-foreground mb-4">Active Sessions</h3>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <div><p className="font-medium text-sm text-foreground">Chrome on Windows</p><p className="text-[11px] text-muted-foreground">Nairobi, Kenya - Current</p></div>
                    </div>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Active</span>
                  </div>
                </Card>
              </>
            )}

            {/* Appearance */}
            {activeSection === "appearance" && (
              <Card className="p-5 border-0 shadow-sm">
                <h3 className="font-semibold text-foreground mb-4">Theme</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {themes.map((t) => {
                    const Icon = t.icon
                    return (
                      <button key={t.id} onClick={() => setTheme(t.id as "light" | "dark")}
                        className={`p-5 rounded-xl border-2 transition-all text-left ${theme === t.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                      >
                        <Icon className={`w-8 h-8 mb-3 ${theme === t.id ? "text-primary" : "text-muted-foreground"}`} />
                        <p className="font-semibold text-foreground">{t.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </Card>
            )}

            {/* Notifications */}
            {activeSection === "notifications" && (
              <Card className="p-5 border-0 shadow-sm">
                <h3 className="font-semibold text-foreground mb-4">Notification Preferences</h3>
                <div className="space-y-2">
                  {Object.entries(notificationSettings).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors">
                      <div>
                        <p className="font-medium text-sm text-foreground capitalize">{key.replace(/([A-Z])/g, " $1")}</p>
                        <p className="text-[11px] text-muted-foreground">Get notified about {key.replace(/([A-Z])/g, " $1").toLowerCase()}</p>
                      </div>
                      <button onClick={() => setNotificationSettings({ ...notificationSettings, [key]: !value })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? "bg-primary" : "bg-muted"}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${value ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Payment */}
            {activeSection === "payment" && (
              <>
                <Card className="p-5 border-0 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">Payment Methods</h3>
                    <Button size="sm" className="rounded-xl">Add New</Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3.5 bg-muted/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-7 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-[9px]">M-PESA</div>
                        <div><p className="font-medium text-sm text-foreground">M-Pesa</p><p className="text-[11px] text-muted-foreground">+254 7** *** **6</p></div>
                      </div>
                      <span className="text-[11px] bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md font-semibold">Default</span>
                    </div>
                    <div className="flex items-center justify-between p-3.5 bg-muted/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-[9px]">VISA</div>
                        <div><p className="font-medium text-sm text-foreground">Visa ending in 4242</p><p className="text-[11px] text-muted-foreground">Expires 12/25</p></div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs h-7">Remove</Button>
                    </div>
                  </div>
                </Card>

                <Card className="p-5 border-0 shadow-sm">
                  <h3 className="font-semibold text-foreground mb-4">Billing History</h3>
                  <div className="space-y-2">
                    {[{ desc: "Kitchen Renovation", amount: "KES 15,000", date: "Jan 15, 2026" }, { desc: "Plumbing Service", amount: "KES 3,500", date: "Jan 10, 2026" }].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl border border-border/50">
                        <div><p className="font-medium text-sm text-foreground">{item.desc}</p><p className="text-[11px] text-muted-foreground">{item.date}</p></div>
                        <div className="text-right"><p className="font-semibold text-sm text-foreground">{item.amount}</p><span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Paid</span></div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}

            {/* Privacy */}
            {activeSection === "privacy" && (
              <>
                <Card className="p-5 border-0 shadow-sm">
                  <h3 className="font-semibold text-foreground mb-1">Data & Privacy</h3>
                  <p className="text-xs text-muted-foreground mb-4">Manage your personal data and account</p>

                  {/* Download Your Data */}
                  <div className="p-4 rounded-xl border border-border/50 mb-3 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">Download Your Data</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Get a full copy of your profile, bookings, messages, payments, and activity history in a ZIP file.</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-xl bg-transparent flex-shrink-0" onClick={() => setShowDownloadModal(true)}>
                        Request
                      </Button>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>Data export typically takes 1-2 minutes</span>
                    </div>
                  </div>

                  {/* Data Included Info */}
                  <div className="p-4 rounded-xl bg-muted/30 mb-3">
                    <p className="text-xs font-medium text-foreground mb-2">Your export will include:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Profile Info", icon: User },
                        { label: "Booking History", icon: FileText },
                        { label: "Messages", icon: MessageCircle },
                        { label: "Payment Records", icon: CreditCard },
                        { label: "Reviews Given", icon: CheckCircle },
                        { label: "Activity Logs", icon: Database },
                      ].map((item) => {
                        const Icon = item.icon
                        return (
                          <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Icon className="w-3.5 h-3.5" />
                            <span>{item.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </Card>

                {/* Delete Account */}
                <Card className="p-5 border-0 shadow-sm border-red-200/50 dark:border-red-900/20">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-600 dark:text-red-400">Delete Account Permanently</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Once deleted, this action cannot be undone. All your data will be permanently removed.</p>
                    </div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-3.5 mb-4">
                    <p className="text-xs text-red-700 dark:text-red-300 font-medium mb-2">Deleting your account will:</p>
                    <ul className="space-y-1.5">
                      {[
                        "Remove all your personal information",
                        "Cancel any active bookings",
                        "Delete your wallet balance (withdraw first!)",
                        "Remove your reviews and ratings",
                        "Revoke access to all services",
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-red-600/80 dark:text-red-400/80">
                          <span className="w-1 h-1 bg-red-400 rounded-full mt-1.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button variant="destructive" className="rounded-xl" size="sm" onClick={() => { setShowDeleteModal(true); setDeleteStep(1); setDeleteConfirmText(""); setDeleteReason("") }}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete My Account
                  </Button>
                </Card>
              </>
            )}

            {/* Help */}
            {activeSection === "help" && (
              <Card className="border-0 shadow-sm overflow-hidden">
                {[
                  { title: "FAQs", desc: "Common questions", icon: HelpCircle },
                  { title: "Contact Support", desc: "Get help from our team", icon: MessageCircle },
                  { title: "Terms of Service", desc: "Read our terms", icon: FileText },
                  { title: "Privacy Policy", desc: "How we protect your data", icon: Shield },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <button key={item.title} className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors border-b border-border/30 last:border-b-0">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center"><Icon className="w-4 h-4 text-muted-foreground" /></div>
                        <div className="text-left"><p className="font-medium text-sm text-foreground">{item.title}</p><p className="text-[11px] text-muted-foreground">{item.desc}</p></div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )
                })}
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Download Data Modal */}
      <Dialog open={showDownloadModal} onOpenChange={(open) => { if (!isDownloading) { setShowDownloadModal(open); setDownloadProgress(0); setDownloadReady(false) } }}>
        <DialogContent className="max-w-sm">
          <div className="text-center">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {isDownloading ? (
                <Loader2 className="w-7 h-7 text-blue-600 dark:text-blue-400 animate-spin" />
              ) : downloadReady ? (
                <CheckCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <FileArchive className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">
              {isDownloading ? "Preparing Your Data..." : downloadReady ? "Download Ready!" : "Download Your Data"}
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              {isDownloading
                ? "We're packaging all your data into a ZIP file."
                : downloadReady
                  ? "Your data export is ready for download."
                  : "This will create a ZIP file containing all your personal data."}
            </p>

            {/* Progress Bar */}
            {(isDownloading || downloadReady) && (
              <div className="mb-5">
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${downloadReady ? "bg-emerald-500" : "bg-blue-500"}`}
                    style={{ width: `${Math.min(downloadProgress, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{Math.min(Math.round(downloadProgress), 100)}% complete</p>
              </div>
            )}

            {downloadReady ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setShowDownloadModal(false); setDownloadReady(false) }} className="flex-1 rounded-xl bg-transparent">
                  Close
                </Button>
                <Button className="flex-1 rounded-xl gap-2" onClick={() => { setShowDownloadModal(false); setDownloadReady(false) }}>
                  <Download className="w-4 h-4" /> Download ZIP
                </Button>
              </div>
            ) : isDownloading ? (
              <p className="text-xs text-muted-foreground">Please wait, do not close this window...</p>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowDownloadModal(false)} className="flex-1 rounded-xl bg-transparent">
                  Cancel
                </Button>
                <Button className="flex-1 rounded-xl gap-2" onClick={handleDownloadData}>
                  <Download className="w-4 h-4" /> Start Export
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Modal */}
      <Dialog open={showDeleteModal} onOpenChange={(open) => { if (!isDeleting) { setShowDeleteModal(open); setDeleteStep(1) } }}>
        <DialogContent className="max-w-md">
          {/* Step Indicator */}
          <div className="flex gap-2 mb-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${s <= deleteStep ? "bg-red-500" : "bg-muted"}`} />
            ))}
          </div>

          {/* Step 1: Reason */}
          {deleteStep === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Why are you leaving?</h3>
                  <p className="text-xs text-muted-foreground">This helps us improve our service</p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                {["I found a better alternative", "The app is too complicated", "Privacy concerns", "Too many notifications", "I no longer need this service", "Other reason"].map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setDeleteReason(reason)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all text-sm ${
                      deleteReason === reason ? "border-red-500 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-300" : "border-border text-foreground hover:border-red-300"
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="flex-1 rounded-xl bg-transparent">Cancel</Button>
                <Button variant="destructive" disabled={!deleteReason} onClick={() => setDeleteStep(2)} className="flex-1 rounded-xl">Continue</Button>
              </div>
            </div>
          )}

          {/* Step 2: Warning */}
          {deleteStep === 2 && (
            <div>
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">Are you absolutely sure?</h3>
                <p className="text-sm text-muted-foreground">This action is permanent and cannot be reversed.</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 mb-4">
                <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-2">You will permanently lose:</p>
                <ul className="space-y-1">
                  {["All personal data and profile", "Booking and payment history", "Wallet balance (KES 5,000)", "Reviews and ratings", "Saved addresses and favorites"].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-red-600/80 dark:text-red-400/80">
                      <X className="w-3 h-3 flex-shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setDeleteStep(1)} className="flex-1 rounded-xl bg-transparent">Back</Button>
                <Button variant="destructive" onClick={() => setDeleteStep(3)} className="flex-1 rounded-xl">I Understand</Button>
              </div>
            </div>
          )}

          {/* Step 3: Final Confirmation */}
          {deleteStep === 3 && (
            <div>
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-1">Final Step</h3>
                <p className="text-sm text-muted-foreground">
                  Type <span className="font-mono font-bold text-foreground">DELETE</span> below to confirm
                </p>
              </div>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder='Type "DELETE" to confirm'
                className="rounded-xl text-center font-mono text-lg mb-4 border-red-200 dark:border-red-900/30 focus-visible:ring-red-500"
              />
              {isDeleting ? (
                <div className="text-center py-4">
                  <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Deleting your account...</p>
                  <p className="text-xs text-muted-foreground mt-1">You will be redirected shortly</p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setDeleteStep(2)} className="flex-1 rounded-xl bg-transparent">Back</Button>
                  <Button
                    variant="destructive"
                    disabled={deleteConfirmText !== "DELETE"}
                    onClick={handleDeleteAccount}
                    className="flex-1 rounded-xl gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Forever
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
