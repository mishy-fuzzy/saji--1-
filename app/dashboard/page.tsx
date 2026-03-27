"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CheckCircle, AlertCircle, Plus } from "lucide-react";

interface User {
  email: string;
  fullName: string;
  role: "customer" | "provider" | "admin";
}

function DashboardContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("saji-user");
    if (!userData) {
      router.push("/auth/login");
    } else {
      setUser(JSON.parse(userData));
      setIsLoading(false);
    }
  }, [router]);

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
            Welcome back, {user.fullName.split(" ")[0]}!
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
              {user.role === "provider" ? 3 : 2}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {user.role === "provider" ? "In progress" : "Awaiting completion"}
            </p>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-2">Completed</div>
            <div className="text-3xl font-bold text-foreground">
              {user.role === "provider" ? 45 : 12}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Total transactions
            </p>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-2">Rating</div>
            <div className="text-3xl font-bold text-primary">
              {user.role === "provider" ? "4.9★" : "4.8★"}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {user.role === "provider" ? "128 reviews" : "from 45 providers"}
            </p>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-2">
              Wallet Balance
            </div>
            <div className="text-3xl font-bold text-foreground">KES 15,500</div>
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
                className="rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                Book New Service
              </Button>
            )}
            {[
              {
                id: 1,
                title: "Electrical Installation",
                provider: "John Electrical",
                status: "in-progress",
                amount: "5,000",
              },
              {
                id: 2,
                title: "Plumbing Repair",
                provider: "Pipe Master",
                status: "awaiting",
                amount: "2,000",
              },
            ].map((job) => (
              <Card
                key={job.id}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {job.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {job.provider}
                    </p>
                    <div className="flex items-center gap-2">
                      {job.status === "in-progress" ? (
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
                      KES {job.amount}
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
            {[
              {
                id: 3,
                title: "Home Cleaning",
                provider: "Clean Sweep",
                amount: "1,500",
                rating: 5,
              },
            ].map((job) => (
              <Card
                key={job.id}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {job.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {job.provider}
                    </p>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-500">Completed</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground mb-2">
                      KES {job.amount}
                    </div>
                    <div className="text-sm font-semibold text-primary mb-2">
                      {job.rating}★ Rated
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
                className="rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"
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
