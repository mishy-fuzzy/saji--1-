"use client";
import { useEffect, useState } from "react";
import {
  Download,
  Save,
  Plus,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Settings as SettingsIcon,
  FileText,
  TrendingUp,
  Bell,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const paymentRules = [
  {
    id: 1,
    service: "Electrical Installation",
    level: "Skilled",
    jobSize: "Various",
    paymentType: "Deposit + Balance",
    rule: "Pending",
  },
  {
    id: 2,
    service: "Health",
    level: "Skilled",
    jobSize: "—",
    paymentType: "Full Upfront",
    rule: "Active",
  },
  {
    id: 3,
    service: "Car Mechanics",
    level: "Skilled",
    jobSize: "—",
    paymentType: "Upfront",
    rule: "Pending",
  },
  {
    id: 4,
    service: "Psychiatrists",
    level: "Skilled",
    jobSize: "20%",
    paymentType: "Milestones",
    rule: "Active",
  },
  {
    id: 5,
    service: "Gastroenterology",
    level: "Skilled",
    jobSize: "Large",
    paymentType: "Milestones",
    rule: "Active",
  },
  {
    id: 6,
    service: "Appliance Repair",
    level: "Semi-Skilled",
    jobSize: "Remote",
    paymentType: "Higher deposit in remote",
    rule: "Pending",
  },
  {
    id: 7,
    service: "Plumbing Repairs",
    level: "Skilled",
    jobSize: "Small",
    paymentType: "Full Upfront",
    rule: "Pending",
  },
];

type PaymentRule = (typeof paymentRules)[number];

const defaultPreferences = {
  platformFee: 5,
  autoApprove: true,
  requireVerification: true,
  enableDisputeResolution: true,
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("payment-rules");
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [exportMessage, setExportMessage] = useState("");
  const [rules, setRules] = useState<PaymentRule[]>(paymentRules);

  const [preferences, setPreferences] = useState(defaultPreferences);

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch("/api/admin/settings", {
          cache: "no-store",
        });
        const payload = await response.json();
        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || "Failed to load admin settings");
        }

        if (payload.data?.preferences) {
          setPreferences({
            ...defaultPreferences,
            ...payload.data.preferences,
          });
        }

        if (
          Array.isArray(payload.data?.rules) &&
          payload.data.rules.length > 0
        ) {
          setRules(payload.data.rules);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load admin settings";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setExportMessage("");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Failed to save preferences");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save preferences";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewRule = async () => {
    setError("");
    setExportMessage("");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ruleAction: "create",
          rule: {
            service: "New Service",
            level: "Skilled",
            jobSize: "Various",
            paymentType: "Deposit + Balance",
            rule: "Pending",
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok || !payload?.data?.rule) {
        throw new Error(payload?.error || "Failed to create payment rule");
      }

      setRules((prev) => [payload.data.rule, ...prev]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create payment rule";
      setError(message);
    }
  };

  const handleEditRule = async (ruleId: number) => {
    setError("");
    setExportMessage("");
    const current = rules.find((item) => item.id === ruleId);
    if (!current) return;

    const nextStatus = current.rule === "Active" ? "Pending" : "Active";
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ruleAction: "update",
          rule: { ...current, rule: nextStatus },
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok || !payload?.data?.rule) {
        throw new Error(payload?.error || "Failed to update payment rule");
      }

      setRules((prev) =>
        prev.map((item) => (item.id === ruleId ? payload.data.rule : item)),
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update payment rule";
      setError(message);
    }
  };

  const handleExport = () => {
    const lines = [
      "type,id,service,level,jobSize,paymentType,status",
      ...rules.map(
        (rule) =>
          `rule,${rule.id},${rule.service},${rule.level},${rule.jobSize},${rule.paymentType},${rule.rule}`,
      ),
      `preference,platformFee,,,,,${preferences.platformFee}`,
      `preference,autoApprove,,,,,${preferences.autoApprove}`,
      `preference,requireVerification,,,,,${preferences.requireVerification}`,
      `preference,enableDisputeResolution,,,,,${preferences.enableDisputeResolution}`,
    ];

    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `admin-settings-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setExportMessage("Export generated successfully.");
  };

  const tabs = [
    { id: "payment-rules", label: "Payment Rules", icon: DollarSign },
    { id: "preferences", label: "Preferences", icon: SettingsIcon },
    { id: "currency", label: "Currency & Rates", icon: TrendingUp },
    { id: "templates", label: "Templates", icon: FileText },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Configure platform-wide settings and rules
        </p>
      </div>

      {/* Top Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          onClick={handleExport}
          variant="outline"
          className="gap-2 bg-transparent"
        >
          <Download size={18} />
          Export
        </Button>
      </div>

      {isLoading && (
        <Card className="p-4 text-sm text-gray-600 dark:text-gray-300">
          Loading settings...
        </Card>
      )}

      {error && (
        <Card className="p-4 text-sm border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </Card>
      )}

      {exportMessage && (
        <Card className="p-4 text-sm border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
          {exportMessage}
        </Card>
      )}

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
        {/* Payment Rules Tab */}
        {activeTab === "payment-rules" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Payment Assignment Rules
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  Define how payments are processed for different service types
                </p>
              </div>
              <Button
                onClick={handleNewRule}
                className="bg-blue-600 hover:bg-blue-700 gap-2"
              >
                <Plus size={18} />
                New Rule
              </Button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Service Type
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Skill Level
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Job Size
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Payment Type
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {rules.map((rule) => (
                      <tr
                        key={rule.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                      >
                        <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                          {rule.service}
                        </td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                          {rule.level}
                        </td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                          {rule.jobSize}
                        </td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                          {rule.paymentType}
                        </td>
                        <td className="px-6 py-4">
                          {rule.rule === "Active" ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 size={14} />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                              <AlertCircle size={14} />
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            onClick={() => handleEditRule(rule.id)}
                            size="sm"
                            variant="outline"
                            className="text-xs bg-transparent"
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>
                Showing 1-{rules.length} of {rules.length} rules
              </span>
              <div className="flex gap-1">
                {[1, 2].map((page) => (
                  <Button
                    key={page}
                    size="sm"
                    variant={page === 1 ? "default" : "outline"}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === "preferences" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Platform Preferences
              </h2>
            </div>

            {/* Platform Fee */}
            <Card className="border-0 shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Platform Commission Fee
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Percentage charged on each transaction
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    {preferences.platformFee}%
                  </div>
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={preferences.platformFee}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    platformFee: parseInt(e.target.value),
                  })
                }
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>1%</span>
                <span>20%</span>
              </div>
            </Card>

            {/* Feature Toggles */}
            <div className="space-y-4">
              {[
                {
                  id: "autoApprove",
                  label: "Auto-Approve Listings",
                  desc: "Automatically approve new service listings after verification",
                },
                {
                  id: "requireVerification",
                  label: "Require Provider Verification",
                  desc: "Mandate background checks for all service providers",
                },
                {
                  id: "enableDisputeResolution",
                  label: "Enable Dispute Resolution",
                  desc: "Allow platform to mediate disputes between parties",
                },
              ].map((item) => (
                <Card
                  key={item.id}
                  className="border-0 shadow-lg p-6 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {item.label}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {item.desc}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        preferences[
                          item.id as keyof typeof preferences
                        ] as boolean
                      }
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          [item.id]: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-12 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
                  </label>
                </Card>
              ))}
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Save size={18} />
              {isSaving ? "Saving..." : "Save Preferences"}
            </Button>
            {saved && (
              <div className="flex items-center gap-2 text-emerald-600 font-medium">
                <CheckCircle2 size={18} />
                Preferences saved successfully
              </div>
            )}
          </div>
        )}

        {/* Currency & Rates Tab */}
        {activeTab === "currency" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Currency & Exchange Rates
              </h2>
            </div>

            <Card className="border-0 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Active Currencies
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { code: "KES", name: "Kenyan Shilling", rate: 123.5 },
                  { code: "USD", name: "US Dollar", rate: 1.0 },
                  { code: "EUR", name: "Euro", rate: 0.92 },
                  { code: "GBP", name: "British Pound", rate: 0.79 },
                ].map((curr) => (
                  <div
                    key={curr.code}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {curr.code}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {curr.name}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-blue-600">
                        {curr.rate}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border-0 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Auto-Update Settings
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Update exchange rates daily
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Automatically fetch latest rates from external APIs
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="sr-only peer"
                  />
                  <div className="w-12 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
                </label>
              </div>
            </Card>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === "templates" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Message Templates
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  Manage automated message and notification templates
                </p>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                <Plus size={18} />
                New Template
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  name: "Job Approval",
                  desc: "Sent when a job is approved",
                  count: "3 variants",
                },
                {
                  name: "Payment Received",
                  desc: "Notifies about received payments",
                  count: "2 variants",
                },
                {
                  name: "Dispute Opened",
                  desc: "Alerts when disputes are raised",
                  count: "2 variants",
                },
                {
                  name: "Job Completion",
                  desc: "Confirmation of completed work",
                  count: "4 variants",
                },
              ].map((template, idx) => (
                <Card
                  key={idx}
                  className="border-0 shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {template.desc}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        {template.count}
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
