"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DollarSign,
  Users,
  Briefcase,
  Star,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuthContext } from "@/lib/auth-context";

type Period = "7d" | "30d" | "90d" | "12m";

type BookingRecord = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  customer?: { name?: string | null } | null;
  service?: { category?: string | null } | null;
};

type ServiceRecord = {
  id: string;
  category?: string | null;
};

const categoryColors = [
  "bg-primary",
  "bg-accent",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-muted-foreground",
];

function getRelativeDateLabel(dateIso: string): string {
  const created = new Date(dateIso).getTime();
  const diffMs = Date.now() - created;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(dateIso).toLocaleDateString();
}

function buildSeries(bookings: BookingRecord[], period: Period): number[] {
  const now = new Date();

  if (period === "7d" || period === "30d") {
    const days = period === "7d" ? 7 : 30;
    const buckets = Array.from({ length: days }, () => 0);
    bookings.forEach((b) => {
      if (String(b.status || "").toLowerCase() !== "completed") return;
      const created = new Date(b.createdAt);
      const diffDays = Math.floor(
        (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays >= 0 && diffDays < days) {
        const idx = days - 1 - diffDays;
        buckets[idx] += Number(b.amount || 0);
      }
    });
    return buckets;
  }

  if (period === "90d") {
    const buckets = Array.from({ length: 12 }, () => 0);
    bookings.forEach((b) => {
      if (String(b.status || "").toLowerCase() !== "completed") return;
      const created = new Date(b.createdAt);
      const diffDays = Math.floor(
        (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays >= 0 && diffDays < 90) {
        const idx = 11 - Math.floor(diffDays / 8);
        buckets[idx] += Number(b.amount || 0);
      }
    });
    return buckets;
  }

  const monthly = Array.from({ length: 12 }, () => 0);
  bookings.forEach((b) => {
    if (String(b.status || "").toLowerCase() !== "completed") return;
    const created = new Date(b.createdAt);
    const diffMonths =
      (now.getFullYear() - created.getFullYear()) * 12 +
      (now.getMonth() - created.getMonth());
    if (diffMonths >= 0 && diffMonths < 12) {
      const idx = 11 - diffMonths;
      monthly[idx] += Number(b.amount || 0);
    }
  });
  return monthly;
}

export default function AnalyticsPage() {
  const { user } = useAuthContext();
  const [period, setPeriod] = useState<Period>("30d");
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const [bookingsResponse, servicesResponse] = await Promise.all([
          fetch(`/api/bookings?providerId=${encodeURIComponent(user.id)}`, {
            cache: "no-store",
          }),
          fetch("/api/services", { cache: "no-store" }),
        ]);

        const bookingsPayload = await bookingsResponse.json();
        const servicesPayload = await servicesResponse.json();

        const bookingsData = Array.isArray(bookingsPayload?.data)
          ? bookingsPayload.data
          : [];
        const allServices = Array.isArray(servicesPayload?.data)
          ? servicesPayload.data
          : [];
        const providerServices = allServices.filter(
          (s: any) => String(s?.providerId || "") === user.id,
        );

        setBookings(bookingsData);
        setServices(providerServices);
      } catch {
        setBookings([]);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  const data = useMemo(() => buildSeries(bookings, period), [bookings, period]);
  const total = data.reduce((a, b) => a + b, 0);
  const maxVal = Math.max(...data, 1);
  const prevTotal = useMemo(() => {
    const prior = data.slice(0, Math.floor(data.length / 2));
    const base = prior.reduce((sum, value) => sum + value, 0);
    return base > 0 ? base : total;
  }, [data, total]);

  const growth =
    prevTotal > 0
      ? (((total - prevTotal) / prevTotal) * 100).toFixed(1)
      : "0.0";
  const isPositive = Number(growth) >= 0;

  const completedJobs = bookings.filter(
    (b) => String(b.status || "").toLowerCase() === "completed",
  );
  const completionRate =
    bookings.length > 0 ? (completedJobs.length / bookings.length) * 100 : 0;
  const performanceScore = (completionRate / 20).toFixed(1);

  const customerRollup = useMemo(() => {
    const byCustomer = new Map<
      string,
      { name: string; jobs: number; spent: number; lastJob: string }
    >();
    completedJobs.forEach((job) => {
      const name = String(job.customer?.name || "Customer");
      const existing = byCustomer.get(name) || {
        name,
        jobs: 0,
        spent: 0,
        lastJob: job.createdAt,
      };
      existing.jobs += 1;
      existing.spent += Number(job.amount || 0);
      if (
        new Date(job.createdAt).getTime() > new Date(existing.lastJob).getTime()
      ) {
        existing.lastJob = job.createdAt;
      }
      byCustomer.set(name, existing);
    });
    return Array.from(byCustomer.values())
      .sort((a, b) => b.jobs - a.jobs || b.spent - a.spent)
      .slice(0, 5);
  }, [completedJobs]);

  const categoryBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    bookings.forEach((b) => {
      const category = String(b.service?.category || "Other");
      counts.set(category, (counts.get(category) || 0) + 1);
    });
    const totalJobs = bookings.length || 1;
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count], idx) => ({
        name,
        count,
        pct: Math.round((count / totalJobs) * 100),
        color: categoryColors[idx % categoryColors.length],
      }));
  }, [bookings]);

  const peakHours = useMemo(() => {
    const labels = [
      "6-8am",
      "8-10am",
      "10-12pm",
      "12-2pm",
      "2-4pm",
      "4-6pm",
      "6-8pm",
      "8-10pm",
    ];
    const buckets = labels.map((label) => ({ hour: label, jobs: 0 }));
    bookings.forEach((b) => {
      const hour = new Date(b.createdAt).getHours();
      const index =
        hour < 8
          ? 0
          : hour < 10
            ? 1
            : hour < 12
              ? 2
              : hour < 14
                ? 3
                : hour < 16
                  ? 4
                  : hour < 18
                    ? 5
                    : hour < 20
                      ? 6
                      : 7;
      buckets[index].jobs += 1;
    });
    return buckets;
  }, [bookings]);

  const peakMax = Math.max(...peakHours.map((h) => h.jobs));

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Analytics & Insights
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your performance and earnings trends
          </p>
        </div>
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {(["7d", "30d", "90d", "12m"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {p === "7d"
                ? "7 Days"
                : p === "30d"
                  ? "30 Days"
                  : p === "90d"
                    ? "90 Days"
                    : "12 Months"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total Revenue",
            value: `KES ${(total / 1000).toFixed(0)}K`,
            change: `+${growth}%`,
            icon: DollarSign,
            positive: true,
          },
          {
            label: "Jobs Completed",
            value: String(completedJobs.length),
            change: `${completionRate.toFixed(1)}%`,
            icon: Briefcase,
            positive: true,
          },
          {
            label: "Performance Score",
            value: performanceScore,
            change: `${completionRate.toFixed(0)}% complete`,
            icon: Star,
            positive: true,
          },
          {
            label: "Repeat Clients",
            value: `${Math.round((customerRollup.filter((c) => c.jobs > 1).length / Math.max(customerRollup.length, 1)) * 100)}%`,
            change: `${customerRollup.length} clients`,
            icon: Users,
            positive: customerRollup.length > 0,
          },
        ].map((kpi, i) => (
          <Card key={i} className="p-4 border border-border rounded-xl">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <kpi.icon className="w-4 h-4 text-primary" />
              </div>
              <span
                className={`text-[11px] font-medium flex items-center gap-0.5 ${kpi.positive ? "text-emerald-600" : "text-destructive"}`}
              >
                {kpi.positive ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {kpi.change}
              </span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {loading ? "..." : kpi.value}
            </p>
            <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      <Card className="p-4 border border-border rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Revenue Trend
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Earnings over selected period
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-foreground">
              KES {loading ? "..." : total.toLocaleString()}
            </p>
            <p
              className={`text-xs font-medium ${isPositive ? "text-emerald-600" : "text-destructive"}`}
            >
              {isPositive ? "+" : ""}
              {growth}% vs previous
            </p>
          </div>
        </div>
        <div className="flex items-end gap-1 h-40">
          {data.map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-primary/80 rounded-t-sm hover:bg-primary transition-colors min-h-0.5"
                style={{ height: `${(val / maxVal) * 100}%` }}
                title={`KES ${val.toLocaleString()}`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-muted-foreground">Start</span>
          <span className="text-[10px] text-muted-foreground">End</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Jobs by Category */}
        <Card className="p-4 border border-border rounded-xl">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
            <PieChartIcon className="w-4 h-4 text-primary" />
            Jobs by Category
          </h3>
          <div className="space-y-3">
            {categoryBreakdown.map((cat) => (
              <div key={cat.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground font-medium">
                    {cat.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {cat.count} jobs ({cat.pct}%)
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${cat.color} rounded-full transition-all`}
                    style={{ width: `${cat.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Peak Hours */}
        <Card className="p-4 border border-border rounded-xl">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-primary" />
            Peak Booking Hours
          </h3>
          <div className="space-y-2">
            {peakHours.map((h) => (
              <div key={h.hour} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-16">
                  {h.hour}
                </span>
                <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all flex items-center justify-end pr-2"
                    style={{ width: `${(h.jobs / peakMax) * 100}%` }}
                  >
                    {h.jobs > 5 && (
                      <span className="text-[10px] font-bold text-accent-foreground">
                        {h.jobs}
                      </span>
                    )}
                  </div>
                </div>
                {h.jobs <= 5 && (
                  <span className="text-[10px] text-muted-foreground w-4">
                    {h.jobs}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top Customers */}
      <Card className="p-4 border border-border rounded-xl">
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-primary" />
          Top Repeat Customers
        </h3>
        <div className="space-y-3">
          {customerRollup.map((cust, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {cust.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {cust.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {cust.jobs} jobs - Last:{" "}
                    {getRelativeDateLabel(cust.lastJob)}
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold text-foreground">
                KES {cust.spent.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Conversion Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Active Services",
            value: String(services.length),
            sub: "In your catalog",
          },
          {
            label: "Avg Job Value",
            value: `KES ${Math.round(total / Math.max(completedJobs.length, 1)).toLocaleString()}`,
            sub: "Completed jobs",
          },
          {
            label: "Customers",
            value: String(customerRollup.length),
            sub: "Unique repeat clients",
          },
          {
            label: "Completion Rate",
            value: `${completionRate.toFixed(0)}%`,
            sub: `${bookings.length - completedJobs.length} not completed`,
          },
        ].map((m, i) => (
          <Card
            key={i}
            className="p-3 border border-border rounded-xl text-center"
          >
            <p className="text-lg font-bold text-foreground">{m.value}</p>
            <p className="text-[11px] text-muted-foreground">{m.label}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
              {m.sub}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
