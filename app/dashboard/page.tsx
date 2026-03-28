"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CheckCircle, AlertCircle, Plus } from "lucide-react";
import { useAuthContext } from "@/lib/auth-context";

function toUiStatus(
  value: string,
): "in-progress" | "pending" | "completed" | "cancelled" {
  const status = String(value || "pending").toLowerCase();
  if (status === "completed") return "completed";
  if (status === "cancelled") return "cancelled";
  if (status === "in_progress" || status === "in-progress")
    return "in-progress";
  if (status === "accepted") return "in-progress";
  return "pending";
}

function DashboardContent() {
  const router = useRouter();
  const { user, isLoading } = useAuthContext();
  const [bookings, setBookings] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);

  const completedCount = bookings.filter(
    (booking) => toUiStatus(String(booking?.status || "")) === "completed",
  ).length;

  const completedRatio = bookings.length
    ? Math.round((completedCount / bookings.length) * 100)
    : 0;

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
      return;
    }

    if (!user?.id) return;

    const loadDashboard = async () => {
      try {
        const bookingQuery =
          user.role === "provider"
            ? `/api/bookings?providerId=${encodeURIComponent(user.id)}`
            : `/api/bookings?customerId=${encodeURIComponent(user.id)}`;

        const [bookingsRes, walletRes] = await Promise.all([
          fetch(bookingQuery, { cache: "no-store" }),
          fetch("/api/wallet", { cache: "no-store" }),
        ]);

        const bookingsPayload = await bookingsRes.json();
        const walletPayload = await walletRes.json();

        setBookings(
          Array.isArray(bookingsPayload?.data) ? bookingsPayload.data : [],
        );
        if (walletRes.ok && walletPayload?.ok) {
          setWalletBalance(Number(walletPayload?.data?.balance || 0));
        }
      } catch {
        setBookings([]);
      }
    };

    loadDashboard();
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome back, {String(user.name || "User").split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground">
            {user.role === "customer"
              ? "Find and book services from verified providers."
              : user.role === "provider"
                ? "Manage your jobs and earnings."
                : "Manage the SAJI platform."}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-2">
              Active Jobs
            </div>
            <div className="text-3xl font-bold text-foreground">
              {
                bookings.filter(
                  (booking) =>
                    !["completed", "cancelled"].includes(
                      toUiStatus(String(booking?.status || "")),
                    ),
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {user.role === "provider" ? "In progress" : "Awaiting completion"}
            </p>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-2">Completed</div>
            <div className="text-3xl font-bold text-foreground">
              {completedCount}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Total transactions
            </p>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-2">Completion</div>
            <div className="text-3xl font-bold text-primary">
              {completedRatio}%
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Based on completed bookings
            </p>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-2">
              Wallet Balance
            </div>
            <div className="text-3xl font-bold text-foreground">
              KES {walletBalance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Available to withdraw
            </p>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid grid-cols-3 lg:grid-cols-3 w-full max-w-md">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
          </TabsList>

          {/* Active Jobs Tab */}
          <TabsContent value="active" className="space-y-4">
            {user.role === "customer" && (
              <Button
                onClick={() => alert("Book new service functionality")}
                className="rounded-lg bg-linear-to-r from-primary to-primary/80 text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                Book New Service
              </Button>
            )}
            {bookings
              .filter(
                (booking) =>
                  toUiStatus(String(booking?.status || "")) !== "completed",
              )
              .slice(0, 10)
              .map((job) => (
                <Card
                  key={job.id}
                  className="p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {String(job?.service?.name || "Service")}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {user.role === "provider"
                          ? String(job?.customer?.name || "Customer")
                          : String(job?.provider?.name || "Provider")}
                      </p>
                      <div className="flex items-center gap-2">
                        {toUiStatus(String(job?.status || "")) ===
                        "in-progress" ? (
                          <>
                            <Clock className="w-4 h-4 text-secondary" />
                            <span className="text-sm text-secondary">
                              In Progress
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            <span className="text-sm text-amber-500">
                              Awaiting Confirmation
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground mb-2">
                        KES {Number(job?.amount || 0).toLocaleString()}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => alert(`View details for job: ${job.id}`)}
                        className="rounded-lg border-2 bg-transparent"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
          </TabsContent>

          {/* Completed Tab */}
          <TabsContent value="completed" className="space-y-4">
            {bookings
              .filter(
                (booking) =>
                  toUiStatus(String(booking?.status || "")) === "completed",
              )
              .slice(0, 10)
              .map((job) => (
                <Card
                  key={job.id}
                  className="p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {String(job?.service?.name || "Service")}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {user.role === "provider"
                          ? String(job?.customer?.name || "Customer")
                          : String(job?.provider?.name || "Provider")}
                      </p>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-500">
                          Completed
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground mb-2">
                        KES {Number(job?.amount || 0).toLocaleString()}
                      </div>
                      <div className="text-sm font-semibold text-primary mb-2">
                        5★ Rated
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
          </TabsContent>

          {/* Draft Tab */}
          <TabsContent value="draft">
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No draft jobs yet</p>
              <Button
                onClick={() => router.push("/services")}
                className="rounded-lg bg-linear-to-r from-primary to-primary/80 text-primary-foreground"
              >
                Create New Job
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}
