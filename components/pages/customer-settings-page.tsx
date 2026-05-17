"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocalization } from "@/lib/hooks/useLocalization";
import { useAuthContext } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bell,
  CreditCard,
  Download,
  HelpCircle,
  Loader2,
  LogOut,
  Moon,
  Settings,
  Shield,
  Sun,
  User,
  CheckCircle,
} from "lucide-react";
import type { Language } from "@/lib/i18n";
import type { CurrencyCode } from "@/lib/currency";

type NotificationSettings = {
  jobUpdates: boolean;
  messages: boolean;
  payments: boolean;
  promotions: boolean;
  emailDigest: boolean;
  pushNotifications: boolean;
};

type BillingItem = {
  id: string;
  desc: string;
  amount: string;
  date: string;
  status: string;
};

type PaymentMethod = {
  provider: string;
  label: string;
  detail: string;
};

export function CustomerSettingsPage() {
  const router = useRouter();
  const { logout } = useAuthContext();
  const { language, setLanguage, currency, setCurrency, theme, setTheme } = useLocalization();

  const [activeSection, setActiveSection] = useState("account");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    jobUpdates: true,
    messages: true,
    payments: true,
    promotions: false,
    emailDigest: true,
    pushNotifications: true,
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [billingHistory, setBillingHistory] = useState<BillingItem[]>([]);

  const settingsSections = [
    { id: "account", label: "Account", icon: User },
    { id: "appearance", label: "Appearance", icon: Sun },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "payment", label: "Payment", icon: CreditCard },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "help", label: "Help & Support", icon: HelpCircle },
  ];

  const languages = [
    { code: "en", name: "English" },
    { code: "sw", name: "Kiswahili" },
    { code: "fr", name: "Francais" },
  ];

  const currencies = ["KES", "USD", "EUR", "GBP"] as CurrencyCode[];

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch("/api/customer/settings", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok || !payload?.ok || !payload?.data) {
          throw new Error(payload?.error || "Failed to load settings");
        }

        const data = payload.data;
        setProfileForm({
          name: String(data?.profile?.name || ""),
          email: String(data?.profile?.email || ""),
          phone: String(data?.profile?.phone || ""),
          location: String(data?.settings?.location || ""),
        });

        setNotificationSettings({
          jobUpdates: Boolean(data?.settings?.notifications?.jobUpdates),
          messages: Boolean(data?.settings?.notifications?.messages),
          payments: Boolean(data?.settings?.notifications?.payments),
          promotions: Boolean(data?.settings?.notifications?.promotions),
          emailDigest: Boolean(data?.settings?.notifications?.emailDigest),
          pushNotifications: Boolean(data?.settings?.notifications?.pushNotifications),
        });

        setLanguage(String(data?.settings?.language || "en") as Language);
        setCurrency(String(data?.settings?.currency || "KES") as CurrencyCode);
        setTheme(data?.settings?.theme === "dark" ? "dark" : "light");

        setPaymentMethods(Array.isArray(data?.paymentMethods) ? data.paymentMethods : []);
        setBillingHistory(Array.isArray(data?.billingHistory) ? data.billingHistory : []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load settings";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [setCurrency, setLanguage, setTheme]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const saveProfile = async () => {
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/customer/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "profile",
          profile: {
            name: profileForm.name,
            phone: profileForm.phone,
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Failed to save profile");
      }
      setMessage("Profile saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const savePreferences = async () => {
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/customer/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "preferences",
          preferences: {
            location: profileForm.location,
            language,
            currency,
            theme,
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Failed to save preferences");
      }
      setMessage("Preferences saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const saveNotifications = async () => {
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/customer/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "notifications",
          notifications: notificationSettings,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Failed to save notifications");
      }
      setMessage("Notification settings saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save notifications");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadData = async () => {
    setError("");
    try {
      const response = await fetch("/api/customer/settings?export=1", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload?.ok || !payload?.data) {
        throw new Error(payload?.error || "Failed to export data");
      }

      const blob = new Blob([JSON.stringify(payload.data, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `customer-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export data");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("Delete account permanently? This cannot be undone.");
    if (!confirmed) return;

    setIsSaving(true);
    setError("");
    try {
      const response = await fetch("/api/customer/settings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Deleted from settings page" }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Failed to delete account");
      }

      await fetch("/api/auth/logout", { method: "POST" });
      logout();
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
    } finally {
      setIsSaving(false);
    }
  };

  const paymentStatusBadge = useMemo(() => {
    return (status: string) => {
      const normalized = String(status || "").toUpperCase();
      if (normalized === "SUCCESS" || normalized === "COMPLETED") {
        return "text-emerald-600";
      }
      if (normalized === "FAILED") {
        return "text-red-600";
      }
      return "text-amber-600";
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 py-6 lg:py-8">
          <div className="flex items-center gap-2 mb-6">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-8 w-56" />
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-56 shrink-0">
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </Card>
            </div>

            <div className="flex-1 space-y-4">
              <Card className="p-5 border-0 shadow-sm space-y-4">
                <Skeleton className="h-6 w-40" />
                <div className="grid sm:grid-cols-2 gap-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-32" />
              </Card>

              <Card className="p-5 border-0 shadow-sm space-y-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-full" />
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6 lg:py-8">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-5 h-5 text-primary" />
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Settings</h1>
        </div>

        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
        {message ? <p className="mb-4 text-sm text-emerald-600">{message}</p> : null}

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-56 shrink-0">
            <Card className="border-0 shadow-sm overflow-hidden sticky top-20">
              <nav className="p-1.5">
                {settingsSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        activeSection === section.id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {section.label}
                    </button>
                  );
                })}
                <hr className="my-2 border-border/50 mx-3" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Log Out
                </button>
              </nav>
            </Card>
          </div>

          <div className="flex-1 space-y-4">
            {activeSection === "account" && (
              <Card className="p-5 border-0 shadow-sm space-y-4">
                <h3 className="font-semibold text-foreground">Profile Information</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input value={profileForm.name} onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))} placeholder="Full Name" />
                  <Input value={profileForm.email} disabled placeholder="Email" />
                  <Input value={profileForm.phone} onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" />
                  <Input value={profileForm.location} onChange={(e) => setProfileForm((p) => ({ ...p, location: e.target.value }))} placeholder="Location" />
                </div>
                <Button onClick={saveProfile} disabled={isSaving} className="rounded-xl">
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </Card>
            )}

            {activeSection === "appearance" && (
              <Card className="p-5 border-0 shadow-sm space-y-4">
                <h3 className="font-semibold text-foreground">Language, Currency, Theme</h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  {languages.map((lang) => (
                    <Button key={lang.code} variant={language === lang.code ? "default" : "outline"} onClick={() => setLanguage(lang.code as Language)}>
                      {lang.name}
                    </Button>
                  ))}
                </div>
                <div className="grid sm:grid-cols-4 gap-3">
                  {currencies.map((curr) => (
                    <Button key={curr} variant={currency === curr ? "default" : "outline"} onClick={() => setCurrency(curr)}>
                      {curr}
                    </Button>
                  ))}
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Button variant={theme === "light" ? "default" : "outline"} onClick={() => setTheme("light")}>
                    <Sun className="w-4 h-4 mr-2" /> Light
                  </Button>
                  <Button variant={theme === "dark" ? "default" : "outline"} onClick={() => setTheme("dark")}>
                    <Moon className="w-4 h-4 mr-2" /> Dark
                  </Button>
                </div>
                <Button onClick={savePreferences} disabled={isSaving} className="rounded-xl">
                  {isSaving ? "Saving..." : "Save Preferences"}
                </Button>
              </Card>
            )}

            {activeSection === "notifications" && (
              <Card className="p-5 border-0 shadow-sm space-y-3">
                <h3 className="font-semibold text-foreground">Notification Preferences</h3>
                {Object.entries(notificationSettings).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 border border-border rounded-xl">
                    <p className="text-sm text-foreground capitalize">{key.replace(/([A-Z])/g, " $1")}</p>
                    <button
                      onClick={() =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          [key]: !value,
                        }))
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? "bg-primary" : "bg-muted"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                ))}
                <Button onClick={saveNotifications} disabled={isSaving} className="rounded-xl">
                  {isSaving ? "Saving..." : "Save Notification Settings"}
                </Button>
              </Card>
            )}

            {activeSection === "payment" && (
              <Card className="p-5 border-0 shadow-sm space-y-4">
                <h3 className="font-semibold text-foreground">Payment Methods</h3>
                {paymentMethods.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No payment methods found from database records.</p>
                ) : (
                  <div className="space-y-2">
                    {paymentMethods.map((method) => (
                      <div key={`${method.provider}-${method.detail}`} className="p-3 rounded-xl border border-border/50">
                        <p className="font-medium text-sm text-foreground">{method.label}</p>
                        <p className="text-xs text-muted-foreground">{method.detail}</p>
                      </div>
                    ))}
                  </div>
                )}

                <h3 className="font-semibold text-foreground pt-2">Billing History</h3>
                {billingHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No billing history found.</p>
                ) : (
                  <div className="space-y-2">
                    {billingHistory.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50">
                        <div>
                          <p className="font-medium text-sm text-foreground">{item.desc}</p>
                          <p className="text-xs text-muted-foreground">{item.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm text-foreground">{item.amount}</p>
                          <p className={`text-xs font-medium ${paymentStatusBadge(item.status)}`}>{item.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {activeSection === "privacy" && (
              <Card className="p-5 border-0 shadow-sm space-y-3">
                <h3 className="font-semibold text-foreground">Data & Privacy</h3>
                <Button variant="outline" className="rounded-xl bg-transparent" onClick={handleDownloadData}>
                  <Download className="w-4 h-4 mr-2" /> Download My Data
                </Button>
                <Button variant="destructive" className="rounded-xl" onClick={handleDeleteAccount} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Delete My Account
                </Button>
              </Card>
            )}

            {activeSection === "help" && (
              <Card className="p-5 border-0 shadow-sm space-y-2">
                <p className="text-sm text-foreground">For support, contact SAJI support from the Help Center.</p>
                <p className="text-xs text-muted-foreground">This section is connected to your live account and settings data.</p>
                <div className="flex items-center gap-2 text-emerald-600 text-sm">
                  <CheckCircle className="w-4 h-4" /> Database-linked settings enabled
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
