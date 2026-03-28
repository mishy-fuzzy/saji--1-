"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Star,
  Phone,
  MessageSquare,
  Navigation,
  MoreVertical,
  Diamond as Dialog,
  X,
  Check,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog as DialogComponent,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthContext } from "@/lib/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ProviderJobsPage() {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [jobsList, setJobsList] = useState<any[]>([]);

  const loadJobs = async () => {
    try {
      const response = await fetch("/api/jobs", { cache: "no-store" });
      const payload = await response.json();
      setJobsList(Array.isArray(payload?.jobs) ? payload.jobs : []);
    } catch {
      setJobsList([]);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    loadJobs();
    const intervalId = window.setInterval(loadJobs, 25000);
    return () => window.clearInterval(intervalId);
  }, [user?.id]);

  const bookingCards = useMemo(() => {
    return jobsList
      .filter((row: any) => {
        const postedByRole = String(row?.postedBy?.role || "").toLowerCase();
        const statusValue = String(row?.status || "pending").toLowerCase();
        return postedByRole === "customer" || statusValue !== "draft";
      })
      .map((row: any) => {
        const statusValue = String(row?.status || "pending").toLowerCase();
        const statusMeta =
          statusValue === "completed"
            ? {
                label: "Completed",
                statusColor:
                  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
              }
            : statusValue === "pending" || statusValue === "open"
              ? {
                  label: "Available",
                  statusColor:
                    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                }
              : statusValue === "in-progress" ||
                  statusValue === "active" ||
                  statusValue === "accepted" ||
                  statusValue === "assigned"
                ? {
                    label: "In Progress",
                    statusColor:
                      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                  }
                : {
                    label: statusValue || "Unknown",
                    statusColor:
                      "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
                  };

        return {
          id: String(row.id),
          bookingId: String(row.id),
          title: String(row?.title || row?.service?.name || "Customer Job"),
          client: String(
            row?.postedBy?.name || row?.customer?.name || "Client",
          ),
          clientAvatar: String(
            row?.postedBy?.image || row?.customer?.image || "/placeholder.svg",
          ),
          location: String(row?.location || row?.service?.category || "Kenya"),
          date: new Date(row?.createdAt || Date.now()).toLocaleString(),
          amount: `KES ${Number(row?.price || row?.amount || 0).toLocaleString()}`,
          status: statusMeta.label,
          statusColor: statusMeta.statusColor,
          urgent: statusValue === "pending" || statusValue === "open",
          distance: "-",
          phone: String(row?.postedBy?.phone || row?.customer?.phone || ""),
          rawStatus: statusValue,
          providerId: String(row?.provider?.id || row?.providerId || ""),
        };
      });
  }, [jobsList]);

  const disputedCards = useMemo(() => {
    return bookingCards.filter((job: any) => job.rawStatus === "disputed");
  }, [bookingCards]);

  const jobs = useMemo(
    () => ({
      active: bookingCards.filter(
        (job: any) =>
          ["in-progress", "active", "accepted", "assigned"].includes(job.rawStatus) &&
          job.providerId === user?.id,
      ),
      pending: bookingCards.filter(
        (job: any) =>
          ["pending", "open"].includes(job.rawStatus) && !job.providerId,
      ),
      completed: bookingCards.filter(
        (job: any) =>
          job.rawStatus === "completed" && job.providerId === user?.id,
      ),
      disputed: disputedCards,
    }),
    [bookingCards, disputedCards, user?.id],
  );

  const tabs = [
    { key: "active", label: "Active", count: jobs.active.length },
    { key: "pending", label: "Available", count: jobs.pending.length },
    { key: "completed", label: "Completed", count: jobs.completed.length },
    { key: "disputed", label: "Disputed", count: jobs.disputed.length },
  ];

  const currentJobs = jobs[activeTab as keyof typeof jobs] || [];

  const filteredJobs = currentJobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.client.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAcceptJob = async (jobId: string) => {
    try {
      const response = await fetch("/api/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: jobId, action: "accept" }),
      });
      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Failed to accept job");
      }

      setShowJobDetails(false);
      await loadJobs();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to accept job");
    }
  };

  const handleCompleteJob = async (jobId: string) => {
    try {
      const response = await fetch("/api/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: jobId, action: "complete" }),
      });
      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Failed to complete job");
      }

      setShowJobDetails(false);
      await loadJobs();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to complete job");
    }
  };

  const handleDeclineJob = (jobId: string) => {
    alert(`Job ${jobId} declined`);
    setShowJobDetails(false);
  };

  const handleCallClient = (clientName: string) => {
    alert(`Initiating call with ${clientName}...`);
  };

  const handleChatClient = (clientName: string) => {
    alert(`Opening chat with ${clientName}...`);
  };

  const handleNavigate = (location: string) => {
    alert(`Opening maps for ${location}...`);
  };

  const openJobDetails = (job: any) => {
    setSelectedJob(job);
    setShowJobDetails(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-6">
      {/* Header */}
      <div className="bg-linear-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 text-white p-6 lg:rounded-b-3xl">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">My Jobs</h1>
          <p className="text-blue-100 text-sm">
            Manage your service requests and track progress
          </p>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{jobs.active.length}</p>
              <p className="text-xs text-blue-100">Active</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{jobs.pending.length}</p>
              <p className="text-xs text-blue-100">Pending</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{jobs.completed.length}</p>
              <p className="text-xs text-blue-100">Done</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">
                KES{" "}
                {bookingCards
                  .reduce(
                    (sum: number, job: any) =>
                      sum +
                      Number(String(job.amount).replace(/[^0-9]/g, "") || 0),
                    0,
                  )
                  .toLocaleString()}
              </p>
              <p className="text-xs text-blue-100">Earned</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4">
        {/* Search & Filter */}
        <Card className="p-4 mb-4 shadow-lg border-0">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {tab.label}
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === tab.key
                    ? "bg-white/20"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Jobs List */}
        <div className="space-y-3">
          {filteredJobs.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                No jobs found
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "Try a different search term"
                  : `You don't have any ${activeTab} jobs yet`}
              </p>
            </Card>
          ) : (
            filteredJobs.map((job) => (
              <Card
                key={job.id}
                className={`p-4 hover:shadow-lg transition-shadow border-0 shadow-sm ${
                  job.urgent ? "ring-2 ring-red-500 ring-offset-2" : ""
                }`}
              >
                {job.urgent && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-medium mb-3">
                    <AlertTriangle className="w-4 h-4" />
                    Urgent Request
                  </div>
                )}

                <div className="flex gap-4">
                  <img
                    src={job.clientAvatar || "/placeholder.svg"}
                    alt={job.client}
                    className="w-14 h-14 rounded-full object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {job.title}
                      </h3>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${job.statusColor}`}
                      >
                        {job.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {job.client}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {job.date}
                      </span>
                      {"distance" in job && (
                        <span className="flex items-center gap-1">
                          <Navigation className="w-3.5 h-3.5" />
                          {job.distance}
                        </span>
                      )}
                    </div>

                    {"rating" in job && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < (job.rating || 0) ? "text-amber-400 fill-amber-400" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          "{job.review}"
                        </span>
                      </div>
                    )}

                    {"disputeReason" in job && (
                      <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs p-2 rounded-lg mb-3">
                        {job.disputeReason}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {job.amount}
                      </p>
                      <div className="flex items-center gap-2">
                        {activeTab === "active" && (
                          <>
                            <Button
                              size="sm"
                              className="h-8 bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => handleCompleteJob(job.id)}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 bg-transparent"
                              onClick={() => handleCallClient(job.client)}
                            >
                              <Phone className="w-3.5 h-3.5 mr-1" />
                              Call
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 bg-transparent"
                              onClick={() => handleChatClient(job.client)}
                            >
                              <MessageSquare className="w-3.5 h-3.5 mr-1" />
                              Chat
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 bg-transparent"
                              onClick={() => openJobDetails(job)}
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                        {activeTab === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-red-600 border-red-200 bg-transparent"
                              onClick={() => handleDeclineJob(job.id)}
                            >
                              Decline
                            </Button>
                            <Button
                              size="sm"
                              className="h-8 bg-green-600 hover:bg-green-700"
                              onClick={() => handleAcceptJob(job.id)}
                            >
                              Accept
                            </Button>
                          </>
                        )}
                        {activeTab === "disputed" && (
                          <Button
                            size="sm"
                            className="h-8 bg-red-600 hover:bg-red-700"
                            onClick={() => openJobDetails(job)}
                          >
                            Respond
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>View Location</DropdownMenuItem>
                            <DropdownMenuItem>Report Issue</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Job Details Modal */}
      <DialogComponent open={showJobDetails} onOpenChange={setShowJobDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-6">
              {/* Job Header */}
              <div className="flex gap-4 pb-4 border-b">
                <img
                  src={selectedJob.clientAvatar || "/placeholder.svg"}
                  alt={selectedJob.client}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedJob.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedJob.client}
                  </p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {selectedJob.amount}
                  </p>
                </div>
              </div>

              {/* Job Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">LOCATION</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4" />
                    {selectedJob.location}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">DATE & TIME</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4" />
                    {selectedJob.date}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 flex-wrap">
                <Button
                  onClick={() => handleCallClient(selectedJob.client)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call Client
                </Button>
                <Button
                  onClick={() => handleChatClient(selectedJob.client)}
                  variant="outline"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat
                </Button>
                <Button
                  onClick={() => handleNavigate(selectedJob.location)}
                  variant="outline"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Navigate
                </Button>
              </div>

              {/* Pending Job Actions */}
              {activeTab === "pending" && (
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleDeclineJob(selectedJob.id)}
                    variant="outline"
                    className="flex-1"
                  >
                    Decline
                  </Button>
                  <Button
                    onClick={() => handleAcceptJob(selectedJob.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Accept Job
                  </Button>
                </div>
              )}

              {activeTab === "active" && (
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleCompleteJob(selectedJob.id)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark Complete
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </DialogComponent>
    </div>
  );
}
