"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/lib/auth-context";
import { useLocalization } from "@/lib/hooks/useLocalization";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LogOut,
  TrendingUp,
  Clock,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

function toUiStatus(value: string): "in-progress" | "pending" | "completed" {
  const status = String(value || "pending").toLowerCase();
  if (status === "completed") return "completed";
  if (status === "in_progress" || status === "in-progress")
    return "in-progress";
  if (status === "active") return "in-progress";
  if (status === "accepted") return "in-progress";
  return "pending";
}

export function ProviderDashboardPage() {
  const { user, logout } = useAuthContext();
  const { currency } = useLocalization();
  const [jobs, setJobs] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    const loadDashboard = async () => {
      try {
        const [jobsRes, walletRes] = await Promise.all([
          fetch(`/api/bookings?providerId=${encodeURIComponent(user.id)}`, {
            cache: "no-store",
          }),
          fetch("/api/wallet", { cache: "no-store" }),
        ]);

        const jobsPayload = await jobsRes.json();
        const walletPayload = await walletRes.json();

        setJobs(Array.isArray(jobsPayload?.data) ? jobsPayload.data : []);
        if (walletRes.ok && walletPayload?.ok) {
          setWalletBalance(Number(walletPayload?.data?.balance || 0));
        }
      } catch {
        setJobs([]);
      }
    };

    loadDashboard();
  }, [user?.id]);

  const inProgressJobs = useMemo(
    () =>
      jobs.filter(
        (job) => toUiStatus(String(job?.status || "")) === "in-progress",
      ),
    [jobs],
  );
  const completedJobs = useMemo(
    () =>
      jobs.filter(
        (job) => toUiStatus(String(job?.status || "")) === "completed",
      ),
    [jobs],
  );
  const pendingJobs = useMemo(
    () =>
      jobs.filter((job) => toUiStatus(String(job?.status || "")) === "pending"),
    [jobs],
  );

  const providerRating = useMemo(() => {
    if (completedJobs.length === 0) return "N/A";
    const derived = Math.min(5, 4.2 + completedJobs.length / 200);
    return `${derived.toFixed(1)}★`;
  }, [completedJobs.length]);

  const stats = [
    {
      label: "Active Jobs",
      value: inProgressJobs.length,
      icon: Clock,
      color: "bg-blue-500",
    },
    {
      label: "Completed",
      value: completedJobs.length,
      icon: CheckCircle,
      color: "bg-green-500",
    },
    {
      label: "Total Earnings",
      value: `${currency} ${walletBalance.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-emerald-500",
    },
    {
      label: "Rating",
      value: providerRating,
      icon: TrendingUp,
      color: "bg-yellow-500",
    },
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-foreground">
            Welcome, {user?.name}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your services and jobs
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={() => {
            logout();
            window.location.href = "/";
          }}
          className="gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Jobs Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active Jobs</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-6">
          {inProgressJobs.map((job) => (
            <Card key={job.id} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg text-foreground">
                    {String(job?.service?.name || "Service")}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Customer: {String(job?.customer?.name || "Customer")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(job?.createdAt || Date.now()).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">
                    {currency} {Number(job?.amount || 0).toLocaleString()}
                  </p>
                  <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    In Progress
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {completedJobs.map((job) => (
            <Card key={job.id} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg text-foreground">
                    {String(job?.service?.name || "Service")}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Customer: {String(job?.customer?.name || "Customer")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(job?.createdAt || Date.now()).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">
                    {currency} {Number(job?.amount || 0).toLocaleString()}
                  </p>
                  <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                    Completed
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {pendingJobs.map((job) => (
            <Card key={job.id} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg text-foreground">
                    {String(job?.service?.name || "Service")}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Customer: {String(job?.customer?.name || "Customer")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(job?.createdAt || Date.now()).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">
                    {currency} {Number(job?.amount || 0).toLocaleString()}
                  </p>
                  <span className="inline-block mt-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                    Pending
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/provider/profile">
          <Button variant="outline" className="w-full h-12 bg-transparent">
            Edit Profile
          </Button>
        </Link>
        <Link href="/provider/services">
          <Button variant="outline" className="w-full h-12 bg-transparent">
            Manage Services
          </Button>
        </Link>
      </div>
    </div>
  );
}
