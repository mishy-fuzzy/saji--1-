"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Calendar,
  Download,
  FileText,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type AnalyticsPayload = {
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    customers: number;
    revenueChange: number;
    orderChange: number;
    averageOrderValueChange: number;
    customerChange: number;
  };
  salesData: Array<{ name: string; revenue: number; orders: number }>;
  monthlySales: Array<{ name: string; revenue: number }>;
  categoryData: Array<{ name: string; value: number; color: string }>;
  trafficSources: Array<{ name: string; visitors: number }>;
  topProducts: Array<{ name: string; sales: number; revenue: number; growth: number }>;
};

const emptyData: AnalyticsPayload = {
  kpis: {
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    customers: 0,
    revenueChange: 0,
    orderChange: 0,
    averageOrderValueChange: 0,
    customerChange: 0,
  },
  salesData: [],
  monthlySales: [],
  categoryData: [],
  trafficSources: [],
  topProducts: [],
};

function downloadTextFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default function ShopkeeperAnalyticsPage() {
  const [dateRange, setDateRange] = useState("7d");
  const [showExportModal, setShowExportModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsPayload>(emptyData);

  useEffect(() => {
    let cancelled = false;

    const loadAnalytics = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/shopkeeper/analytics?range=${encodeURIComponent(dateRange)}`, {
          cache: "no-store",
        });
        const payload = await response.json();

        if (!cancelled && response.ok && payload?.ok && payload?.data) {
          setAnalytics(payload.data as AnalyticsPayload);
        }
      } catch {
        if (!cancelled) {
          setAnalytics(emptyData);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, [dateRange]);

  const handleExportReport = (format: string) => {
    const normalized = String(format || "csv").toLowerCase();
    const dateTag = new Date().toISOString().slice(0, 10);

    if (normalized === "pdf") {
      const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Analytics Report</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
      h1 { margin: 0 0 8px; }
      .meta { color: #6b7280; margin-bottom: 16px; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
      .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; }
      .label { font-size: 12px; color: #6b7280; }
      .value { font-size: 20px; font-weight: 700; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; font-size: 12px; }
      th { background: #f3f4f6; }
    </style>
  </head>
  <body>
    <h1>Shopkeeper Analytics Report</h1>
    <div class="meta">Range: ${escapeHtml(dateRange)} | Generated: ${escapeHtml(new Date().toLocaleString())}</div>
    <div class="grid">
      <div class="card"><div class="label">Total Revenue</div><div class="value">KES ${analytics.kpis.totalRevenue.toLocaleString()}</div></div>
      <div class="card"><div class="label">Total Orders</div><div class="value">${analytics.kpis.totalOrders.toLocaleString()}</div></div>
      <div class="card"><div class="label">Average Order Value</div><div class="value">KES ${Math.round(analytics.kpis.averageOrderValue).toLocaleString()}</div></div>
      <div class="card"><div class="label">Customers</div><div class="value">${analytics.kpis.customers.toLocaleString()}</div></div>
    </div>

    <h2>Top Products</h2>
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Units Sold</th>
          <th>Revenue (KES)</th>
          <th>Growth %</th>
        </tr>
      </thead>
      <tbody>
        ${analytics.topProducts
          .map(
            (product) => `<tr>
              <td>${escapeHtml(String(product.name || ""))}</td>
              <td>${Number(product.sales || 0)}</td>
              <td>${Number(product.revenue || 0).toLocaleString()}</td>
              <td>${Number(product.growth || 0).toFixed(1)}</td>
            </tr>`,
          )
          .join("")}
      </tbody>
    </table>
  </body>
</html>`;

      const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1000,height=720");
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
      setShowExportModal(false);
      return;
    }

    const headers = ["section", "metric", "value"];
    const rows: string[][] = [
      ["kpi", "totalRevenue", String(analytics.kpis.totalRevenue)],
      ["kpi", "totalOrders", String(analytics.kpis.totalOrders)],
      ["kpi", "averageOrderValue", String(analytics.kpis.averageOrderValue)],
      ["kpi", "customers", String(analytics.kpis.customers)],
      ["kpi", "revenueChangePercent", String(analytics.kpis.revenueChange)],
      ["kpi", "orderChangePercent", String(analytics.kpis.orderChange)],
      ["kpi", "averageOrderValueChangePercent", String(analytics.kpis.averageOrderValueChange)],
      ["kpi", "customerChangePercent", String(analytics.kpis.customerChange)],
      ...analytics.topProducts.map((item) => [
        "topProduct",
        String(item.name || ""),
        `sales=${Number(item.sales || 0)};revenue=${Number(item.revenue || 0)};growth=${Number(item.growth || 0)}`,
      ]),
      ...analytics.categoryData.map((item) => [
        "categoryShare",
        String(item.name || ""),
        String(Number(item.value || 0)),
      ]),
      ...analytics.salesData.map((item) => [
        "salesByDay",
        String(item.name || ""),
        `revenue=${Number(item.revenue || 0)};orders=${Number(item.orders || 0)}`,
      ]),
    ];

    const csv = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/\"/g, '""')}"`).join(","))].join("\n");
    if (normalized === "excel") {
      downloadTextFile(csv, `analytics-${dateTag}.xls`, "application/vnd.ms-excel;charset=utf-8");
    } else {
      downloadTextFile(csv, `analytics-${dateTag}.csv`, "text/csv;charset=utf-8");
    }
    setShowExportModal(false);
  };

  const kpis = useMemo(
    () => [
      {
        label: "Total Revenue",
        value: `KES ${analytics.kpis.totalRevenue.toLocaleString()}`,
        change: analytics.kpis.revenueChange,
        trend: analytics.kpis.revenueChange >= 0 ? "up" : "down",
        icon: DollarSign,
        color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
      },
      {
        label: "Total Orders",
        value: analytics.kpis.totalOrders.toLocaleString(),
        change: analytics.kpis.orderChange,
        trend: analytics.kpis.orderChange >= 0 ? "up" : "down",
        icon: ShoppingCart,
        color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
      },
      {
        label: "Avg Order Value",
        value: `KES ${Math.round(analytics.kpis.averageOrderValue).toLocaleString()}`,
        change: analytics.kpis.averageOrderValueChange,
        trend: analytics.kpis.averageOrderValueChange >= 0 ? "up" : "down",
        icon: BarChart3,
        color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
      },
      {
        label: "Customers",
        value: analytics.kpis.customers.toLocaleString(),
        change: analytics.kpis.customerChange,
        trend: analytics.kpis.customerChange >= 0 ? "up" : "down",
        icon: Users,
        color: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
      },
    ],
    [analytics],
  );

  const formatCurrencyCompact = (value: number) => {
    if (value >= 1000000) return `KES ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `KES ${(value / 1000).toFixed(0)}K`;
    return `KES ${value.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Analytics & Reports</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track and analyze your shop performance</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5">
              <Calendar className="w-4 h-4 text-amber-600" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-transparent text-sm outline-none text-gray-700 dark:text-gray-200"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="year">This Year</option>
              </select>
            </div>
            <Button onClick={() => setShowExportModal(true)} className="bg-amber-600 hover:bg-amber-700 gap-2 text-sm h-9">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            const isUp = kpi.trend === "up";
            return (
              <Card key={idx} className="p-4 lg:p-5 border-0 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${kpi.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className={`flex items-center gap-0.5 text-xs font-semibold ${isUp ? "text-emerald-600" : "text-red-500"}`}>
                    {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(kpi.change)}%
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{kpi.label}</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{kpi.value}</p>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Card className="lg:col-span-2 p-4 lg:p-5 border-0 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Revenue Trend</h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">Recent days</span>
            </div>
            <div className="h-64 lg:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.salesData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(value: number) => [`KES ${value.toLocaleString()}`, "Revenue"]} contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: 12 }} />
                  <Area type="monotone" dataKey="revenue" stroke="#d97706" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-4 lg:p-5 border-0 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Sales by Category</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analytics.categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                    {analytics.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value}%`, "Share"]} contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {analytics.categoryData.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-gray-700 dark:text-gray-300">{cat.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{cat.value}%</span>
                </div>
              ))}
              {analytics.categoryData.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No category data available.</p>}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <Card className="p-4 lg:p-5 border-0 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Monthly Revenue</h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">Last 6 months</span>
            </div>
            <div className="h-56 lg:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.monthlySales} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(value: number) => [`KES ${value.toLocaleString()}`, "Revenue"]} contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: 12 }} />
                  <Bar dataKey="revenue" fill="#d97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-4 lg:p-5 border-0 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Activity Sources</h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">Current period</span>
            </div>
            <div className="h-56 lg:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.trafficSources} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="#9ca3af" width={80} />
                  <Tooltip formatter={(value: number) => [value.toLocaleString(), "Count"]} contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: 12 }} />
                  <Bar dataKey="visitors" fill="#2563eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="p-4 lg:p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Top Performing Products</h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">Sorted by revenue</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left px-4 lg:px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                  <th className="text-left px-4 lg:px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="text-left px-4 lg:px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Units Sold</th>
                  <th className="text-left px-4 lg:px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Revenue</th>
                  <th className="text-left px-4 lg:px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Growth</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topProducts.map((product, idx) => (
                  <tr key={`${product.name}-${idx}`} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 lg:px-5 py-3">
                      <span className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-4 lg:px-5 py-3 text-sm font-medium text-gray-900 dark:text-white">{product.name}</td>
                    <td className="px-4 lg:px-5 py-3 text-sm text-gray-600 dark:text-gray-400">{product.sales}</td>
                    <td className="px-4 lg:px-5 py-3 text-sm font-semibold text-gray-900 dark:text-white">{formatCurrencyCompact(product.revenue)}</td>
                    <td className="px-4 lg:px-5 py-3">
                      <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${product.growth >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {product.growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(product.growth)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!isLoading && analytics.topProducts.length === 0 && (
              <p className="p-4 text-sm text-gray-500 dark:text-gray-400">No product analytics yet.</p>
            )}
          </div>
        </Card>
      </div>

      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Export Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {[
              { format: "pdf", label: "PDF Report", desc: "Formatted document with charts", color: "text-red-600" },
              { format: "excel", label: "Excel Spreadsheet", desc: "Raw data in spreadsheet", color: "text-emerald-600" },
              { format: "csv", label: "CSV File", desc: "Comma-separated values", color: "text-blue-600" },
            ].map((item) => (
              <button
                key={item.format}
                onClick={() => handleExportReport(item.format)}
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left flex items-center gap-3"
              >
                <FileText className={`w-5 h-5 ${item.color}`} />
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white">{item.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
