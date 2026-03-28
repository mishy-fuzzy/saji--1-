"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocalization } from "@/lib/hooks/useLocalization";
import {
  Users,
  Briefcase,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Activity,
  Clock,
  Shield,
  DollarSign,
  Eye,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const chartData: any[] = [];

const pieData: any[] = [];

export default function AdminDashboard() {
  const { currency, convertPrice, formatCurrency } = useLocalization();
  const router = useRouter();
  const [selectedMetric, setSelectedMetric] = useState("revenue");
  const [data, setData] = useState({
    users: 0,
    jobs: 0,
    jobValue: 0,
    revenue: 0,
    pending: 0,
  });

  useEffect(() => {
    fetch("/api/admin/stats", {
      headers: { "x-user-role": "admin" },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.ok) {
          setData({
            users: json.count,
            jobs: json.jobs,
            jobValue: Number(json.jobValue || 0),
            revenue: json.revenue,
            pending: json.pending,
          });
        }
      });
  }, []);

  const stats = [
    {
      label: "Total Users",
      value: data.users.toLocaleString(),
      change: "0%",
      positive: true,
      icon: Users,
      color: "from-blue-500/10 to-blue-600/10",
      textColor: "text-blue-600",
    },
    {
      label: "Total Jobs",
      value: data.jobs.toLocaleString(),
      change: "0%",
      positive: true,
      icon: Briefcase,
      color: "from-emerald-500/10 to-emerald-600/10",
      textColor: "text-emerald-600",
    },
    {
      label: "Jobs Value",
      value: formatCurrency(data.jobValue),
      change: "0%",
      positive: true,
      icon: DollarSign,
      color: "from-amber-500/10 to-amber-600/10",
      textColor: "text-amber-600",
    },
    {
      label: "Pending Actions",
      value: data.pending.toLocaleString(),
      change: "0%",
      positive: false,
      icon: AlertTriangle,
      color: "from-rose-500/10 to-rose-600/10",
      textColor: "text-rose-600",
    },
  ];

  const recentActivities: any[] = [];

  const topPerformers: any[] = [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back, Admin! Here's your platform overview.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => alert("Export admin dashboard data")}
            className="bg-transparent"
          >
            Export
          </Button>
          <Button
            onClick={() => alert("Generate admin dashboard report")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Generate Report
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card
              key={i}
              className={`p-6 border-0 shadow-lg bg-linear-to-br ${stat.color} dark:from-gray-800 dark:to-gray-800 hover:shadow-xl transition-shadow`}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`p-3 rounded-lg bg-white/50 dark:bg-gray-700/50`}
                >
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-semibold ${stat.positive ? "text-emerald-600" : "text-red-600"}`}
                >
                  {stat.positive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {stat.change}
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                {stat.label}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stat.value}
              </p>
            </Card>
          );
        })}
      </div>

      {/* Revenue & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2 p-6 border-0 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Revenue Overview
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Last 7 days performance
              </p>
            </div>
            <div className="flex gap-2">
              {["7d", "30d", "90d"].map((period) => (
                <button
                  key={period}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    selectedMetric === period
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(data.revenue)}
              </p>
              <p className="text-xs text-emerald-600 mt-1">0% from last week</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Jobs Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(data.jobValue)}
              </p>
              <p className="text-xs text-emerald-600 mt-1">0% from last week</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Commission</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(data.revenue * 0.1)}
              </p>
              <p className="text-xs text-emerald-600 mt-1">0% from last week</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Transaction</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(data.jobs > 0 ? data.revenue / data.jobs : 0)}
              </p>
              <p className="text-xs text-red-600 mt-1">0% from last week</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Legend />
              <Bar dataKey="earnings" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              <Bar dataKey="commission" fill="#fbbf24" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Task Status Pie Chart */}
        <Card className="p-6 border-0 shadow-lg">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
              Task Distribution
            </h2>

            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-3 mt-6">
              {pieData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      {item.name}
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Activities & Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card className="p-6 border-0 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Recent Activities
            </h2>
            <Button
              variant="outline"
              className="bg-transparent text-sm"
              onClick={() => router.push("/admin/audit-log")}
            >
              View All
            </Button>
          </div>

          <div className="space-y-4">
            {recentActivities.map((activity, i) => {
              const Icon = activity.icon;
              return (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
                >
                  <div
                    className={`p-2 rounded-lg ${
                      activity.type === "user"
                        ? "bg-blue-100 dark:bg-blue-900/30"
                        : activity.type === "job"
                          ? "bg-yellow-100 dark:bg-yellow-900/30"
                          : activity.type === "completed"
                            ? "bg-emerald-100 dark:bg-emerald-900/30"
                            : "bg-red-100 dark:bg-red-900/30"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        activity.type === "user"
                          ? "text-blue-600"
                          : activity.type === "job"
                            ? "text-yellow-600"
                            : activity.type === "completed"
                              ? "text-emerald-600"
                              : "text-red-600"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {activity.label}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {activity.detail}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {activity.time}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Top Performers */}
        <Card className="p-6 border-0 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Top Performers
            </h2>
            <Button
              variant="outline"
              className="bg-transparent text-sm"
              onClick={() => router.push("/admin/users")}
            >
              View All
            </Button>
          </div>

          <div className="space-y-3">
            {topPerformers.map((performer, i) => (
              <div
                key={i}
                className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                      {performer.name.split(" ")[0][0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {performer.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {performer.tasks} tasks completed
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      performer.status === "Active"
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-400"
                    }`}
                  >
                    {performer.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <p className="text-gray-600 dark:text-gray-400">Earnings</p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      KES {performer.earnings.toLocaleString()}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
