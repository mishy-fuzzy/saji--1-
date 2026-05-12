"use client";

import { useCallback, useState, useEffect } from "react";
import { useAuthContext } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ChevronLeft,
  Clock,
  MapPin,
  Star,
  AlertCircle,
  Phone,
  MessageCircle,
  CalendarIcon,
  Flag,
  CheckCircle,
  XCircle,
  RotateCcw,
  Briefcase,
  Navigation,
  Radio,
  Shield,
  ThumbsUp,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";

interface Job {
  id: string;
  title: string;
  provider: string;
  providerPhone: string;
  providerAvatar: string;
  status: "active" | "completed" | "cancelled" | "scheduled";
  date: string;
  scheduledDate?: Date;
  time: string;
  location: string;
  price: number;
  rating?: number;
  image: string;
  description?: string;
  progress?: number;
  eta?: string;
  trackable?: boolean;
  reviewed?: boolean;
}

export function CustomerJobsPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuthContext();
  const [activeTab, setActiveTab] = useState<
    "active" | "scheduled" | "completed" | "cancelled"
  >("active");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showTrackingPanel, setShowTrackingPanel] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(
    undefined,
  );
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewTags, setReviewTags] = useState<string[]>([]);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [trackingEta, setTrackingEta] = useState(12);
  const [jobs, setJobs] = useState<Job[]>([]);

  const handleUnauthorized = useCallback(async () => {
    await logout();
  }, [logout]);

  // Simulate ETA countdown for tracking
  useEffect(() => {
    if (!showTrackingPanel) return;
    const interval = setInterval(
      () => setTrackingEta((prev) => Math.max(prev - 1, 1)),
      5000,
    );
    return () => clearInterval(interval);
  }, [showTrackingPanel]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user?.id) {
      setJobs([]);
      return;
    }

    let active = true;

    const loadJobs = async () => {
      try {
        const response = await fetch("/api/jobs", { cache: "no-store" });

        if (response.status === 401) {
          await handleUnauthorized();
          return;
        }

        const payload = await response.json();
        const rows = Array.isArray(payload?.jobs)
          ? payload.jobs
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

        const mappedJobs: Job[] = rows.map((row: any) => {
          const rawStatus = String(row?.status || "pending").toLowerCase();
          const status: Job["status"] =
            rawStatus === "completed"
              ? "completed"
              : rawStatus === "cancelled"
                ? "cancelled"
                : rawStatus === "scheduled"
                  ? "scheduled"
                  : "active";

          return {
            id: String(row?.id || ""),
            title: String(row?.title || "Job"),
            provider: String(row?.provider?.name || "Unassigned"),
            providerPhone: String(row?.provider?.phone || ""),
            providerAvatar: String(row?.provider?.image || "/placeholder.svg"),
            status,
            date: new Date(row?.createdAt || Date.now()).toLocaleDateString(),
            time: "Any time",
            location: String(
              row?.location || row?.service?.category || "Location TBD",
            ),
            price: Number(row?.price || 0),
            rating: undefined,
            image: String(row?.service?.image || "/placeholder.svg"),
            description: String(row?.description || ""),
            progress:
              rawStatus === "completed"
                ? 100
                : rawStatus === "active" || rawStatus === "accepted" || rawStatus === "in_progress" || rawStatus === "pending"
                  ? 60
                  : 0,
            eta: "Live",
            trackable: rawStatus === "active" || rawStatus === "accepted" || rawStatus === "in_progress" || rawStatus === "pending",
            reviewed: false,
          };
        });

        if (active) {
          setJobs(mappedJobs);
        }
      } catch {
        if (active) {
          setJobs([]);
        }
      }
    };

    loadJobs();
    return () => {
      active = false;
    };
  }, [handleUnauthorized, isAuthenticated, isLoading, user?.id]);

  const reviewQuickTags = [
    "Punctual",
    "Professional",
    "Friendly",
    "Quality Work",
    "Clean",
    "Fast",
    "Great Communication",
    "Affordable",
  ];

  const timeSlots = [
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
    "05:00 PM",
  ];
  const filteredJobs = jobs.filter((job) => job.status === activeTab);
  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  const statusConfig: Record<
    string,
    { bg: string; text: string; icon: typeof Clock }
  > = {
    active: {
      bg: "bg-blue-100 dark:bg-blue-900/30",
      text: "text-blue-700 dark:text-blue-400",
      icon: Clock,
    },
    scheduled: {
      bg: "bg-amber-100 dark:bg-amber-900/30",
      text: "text-amber-700 dark:text-amber-400",
      icon: CalendarIcon,
    },
    completed: {
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
      text: "text-emerald-700 dark:text-emerald-400",
      icon: CheckCircle,
    },
    cancelled: {
      bg: "bg-red-100 dark:bg-red-900/30",
      text: "text-red-700 dark:text-red-400",
      icon: XCircle,
    },
  };

  const handleReport = () => {
    alert(`Report submitted: ${reportReason}`);
    setShowReportModal(false);
    setReportReason("");
    setReportDetails("");
  };
  const handleReschedule = () => {
    if (rescheduleDate && rescheduleTime) {
      alert(
        `Rescheduled to ${format(rescheduleDate, "PPP")} at ${rescheduleTime}`,
      );
      setShowRescheduleModal(false);
    }
  };
  const handleReviewSubmit = () => {
    setReviewSubmitted(true);
    setTimeout(() => {
      setShowReviewModal(false);
      setReviewSubmitted(false);
      setReviewRating(0);
      setReviewComment("");
      setReviewTags([]);
    }, 2000);
  };
  const toggleTag = (tag: string) =>
    setReviewTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );

  // ---- Job Details View ----
  if (selectedJobId && selectedJob) {
    const config = statusConfig[selectedJob.status];
    const StatusIcon = config.icon;
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8">
          <button
            onClick={() => setSelectedJobId(null)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Jobs
          </button>

          {/* Hero Image */}
          <div className="relative h-48 lg:h-64 rounded-2xl overflow-hidden mb-6">
            <Image
              src={selectedJob.image || "/placeholder.svg"}
              alt={selectedJob.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-white mb-0.5">
                  {selectedJob.title}
                </h1>
                <p className="text-white/80 text-sm">
                  {selectedJob.description}
                </p>
              </div>
              <span
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 backdrop-blur-sm ${config.bg} ${config.text}`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {selectedJob.status.charAt(0).toUpperCase() +
                  selectedJob.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Live Tracking Banner for Active Jobs */}
          {selectedJob.status === "active" && selectedJob.trackable && (
            <Card className="p-4 mb-4 border-0 shadow-sm bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground flex items-center gap-2">
                      Provider is en route
                      <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                        <Radio className="w-3 h-3 animate-pulse" />
                        LIVE
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Estimated arrival in{" "}
                      <strong className="text-foreground">
                        {trackingEta} min
                      </strong>
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="rounded-xl gap-1.5"
                  onClick={() => setShowTrackingPanel(true)}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Track
                </Button>
              </div>
            </Card>
          )}

          {/* Progress */}
          {selectedJob.status === "active" &&
            selectedJob.progress !== undefined && (
              <Card className="p-4 mb-4 border-0 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-foreground">
                    Service Progress
                  </p>
                  <p className="text-sm font-bold text-primary">
                    {selectedJob.progress}%
                  </p>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-primary to-blue-400 rounded-full transition-all"
                    style={{ width: `${selectedJob.progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-[11px] text-muted-foreground">
                  <span>Started</span>
                  <span>In Progress</span>
                  <span>Finishing</span>
                </div>
              </Card>
            )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Card className="p-4 border-0 shadow-sm">
              <CalendarIcon className="w-4 h-4 text-muted-foreground mb-2" />
              <p className="font-semibold text-sm text-foreground">
                {selectedJob.date}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedJob.time}
              </p>
            </Card>
            <Card className="p-4 border-0 shadow-sm">
              <MapPin className="w-4 h-4 text-muted-foreground mb-2" />
              <p className="font-semibold text-sm text-foreground">
                {selectedJob.location}
              </p>
              <p className="text-xs text-muted-foreground">Service location</p>
            </Card>
          </div>

          {/* Provider */}
          <Card className="p-4 mb-4 border-0 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Service Provider
            </p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-background">
                <Image
                  src={selectedJob.providerAvatar || "/placeholder.svg"}
                  alt={selectedJob.provider}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">
                  {selectedJob.provider}
                </p>
                {selectedJob.rating && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-medium">
                      {selectedJob.rating}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                className="flex-1 gap-2 rounded-xl bg-transparent h-9 text-sm"
                onClick={() =>
                  (window.location.href = `tel:${selectedJob.providerPhone}`)
                }
              >
                <Phone className="w-3.5 h-3.5" />
                Call
              </Button>
              <Link href="/customer/messages" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full gap-2 rounded-xl bg-transparent h-9 text-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Message
                </Button>
              </Link>
            </div>
          </Card>

          {/* Price */}
          <Card className="p-4 mb-4 border-0 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Service Cost</p>
                <p className="text-2xl font-bold text-foreground">
                  KES {selectedJob.price.toLocaleString()}
                </p>
              </div>
              {selectedJob.status === "completed" && !selectedJob.reviewed && (
                <Button
                  size="sm"
                  className="rounded-xl gap-1.5"
                  onClick={() => setShowReviewModal(true)}
                >
                  <Star className="w-3.5 h-3.5" />
                  Rate Service
                </Button>
              )}
              {selectedJob.status === "completed" && selectedJob.reviewed && (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Reviewed
                </span>
              )}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            {selectedJob.status === "scheduled" && (
              <Button
                variant="outline"
                className="flex-1 gap-2 rounded-xl bg-transparent"
                onClick={() => setShowRescheduleModal(true)}
              >
                <RotateCcw className="w-4 h-4" />
                Reschedule
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1 gap-2 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 bg-transparent"
              onClick={() => setShowReportModal(true)}
            >
              <Flag className="w-4 h-4" />
              Report Issue
            </Button>
          </div>
        </div>

        {/* Live Tracking Modal */}
        <Dialog open={showTrackingPanel} onOpenChange={setShowTrackingPanel}>
          <DialogContent
            className="max-w-lg p-0 overflow-hidden rounded-2xl"
            aria-describedby={undefined}
          >
            <div className="relative h-64 bg-linear-to-br from-slate-900 to-slate-800">
              {/* Simulated Map */}
              <div className="absolute inset-0 opacity-10">
                <svg width="100%" height="100%">
                  <defs>
                    <pattern
                      id="tgrid"
                      width="40"
                      height="40"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 40 0 L 0 0 0 40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="0.5"
                        className="text-slate-400"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#tgrid)" />
                </svg>
              </div>
              <div className="absolute inset-0 opacity-20">
                <svg width="100%" height="100%">
                  <line
                    x1="30%"
                    y1="0"
                    x2="30%"
                    y2="100%"
                    stroke="#64748b"
                    strokeWidth="4"
                  />
                  <line
                    x1="60%"
                    y1="0"
                    x2="70%"
                    y2="100%"
                    stroke="#64748b"
                    strokeWidth="6"
                  />
                  <line
                    x1="0"
                    y1="40%"
                    x2="100%"
                    y2="45%"
                    stroke="#64748b"
                    strokeWidth="5"
                  />
                  <line
                    x1="0"
                    y1="70%"
                    x2="100%"
                    y2="65%"
                    stroke="#64748b"
                    strokeWidth="3"
                  />
                </svg>
              </div>
              {/* Provider marker */}
              <div className="absolute top-1/3 left-[40%] animate-pulse">
                <div className="w-12 h-12 rounded-full overflow-hidden ring-4 ring-blue-500 shadow-xl">
                  <Image
                    src={selectedJob?.providerAvatar || "/placeholder.svg"}
                    alt=""
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                </div>
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                  {trackingEta} min
                </div>
              </div>
              {/* Your location marker */}
              <div className="absolute bottom-1/4 right-[35%]">
                <div className="relative">
                  <div className="w-5 h-5 bg-emerald-500 rounded-full border-3 border-white shadow-xl" />
                  <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-40" />
                </div>
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-emerald-400 whitespace-nowrap">
                  You
                </div>
              </div>
              {/* Dotted path */}
              <svg className="absolute inset-0 w-full h-full">
                <line
                  x1="46%"
                  y1="42%"
                  x2="63%"
                  y2="72%"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />
              </svg>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-background">
                  <Image
                    src={selectedJob?.providerAvatar || "/placeholder.svg"}
                    alt=""
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    {selectedJob?.provider}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedJob?.title}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {trackingEta}
                  </p>
                  <p className="text-xs text-muted-foreground">min away</p>
                </div>
              </div>
              <div className="flex gap-4 mb-4">
                {[
                  { label: "Accepted", done: true },
                  { label: "En Route", done: true },
                  { label: "Arriving", done: trackingEta <= 3 },
                  { label: "Started", done: false },
                ].map((step, i) => (
                  <div key={i} className="flex-1 text-center">
                    <div
                      className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${step.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                    >
                      {step.done ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-bold">{i + 1}</span>
                      )}
                    </div>
                    <p
                      className={`text-[11px] font-medium ${step.done ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {step.label}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl bg-transparent gap-1.5"
                  onClick={() =>
                    (window.location.href = `tel:${selectedJob?.providerPhone}`)
                  }
                >
                  <Phone className="w-4 h-4" />
                  Call
                </Button>
                <Link href="/customer/messages" className="flex-1">
                  <Button className="w-full rounded-xl gap-1.5">
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </Button>
                </Link>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Review Modal */}
        <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
          <DialogContent
            className="max-w-md rounded-2xl"
            aria-describedby={undefined}
          >
            {!reviewSubmitted ? (
              <>
                <DialogHeader>
                  <DialogTitle>Rate Your Service</DialogTitle>
                </DialogHeader>
                <div className="space-y-5 py-2">
                  {/* Provider Info */}
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      <Image
                        src={selectedJob?.providerAvatar || "/placeholder.svg"}
                        alt=""
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">
                        {selectedJob?.provider}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedJob?.title}
                      </p>
                    </div>
                  </div>

                  {/* Star Rating */}
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground mb-3">
                      How was the service?
                    </p>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setReviewRating(star)}
                          onMouseEnter={() => setReviewHover(star)}
                          onMouseLeave={() => setReviewHover(0)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-10 h-10 transition-colors ${star <= (reviewHover || reviewRating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                          />
                        </button>
                      ))}
                    </div>
                    {reviewRating > 0 && (
                      <p className="text-sm font-medium mt-2 text-foreground">
                        {reviewRating === 5
                          ? "Excellent!"
                          : reviewRating === 4
                            ? "Great!"
                            : reviewRating === 3
                              ? "Good"
                              : reviewRating === 2
                                ? "Fair"
                                : "Poor"}
                      </p>
                    )}
                  </div>

                  {/* Quick Tags */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      What stood out?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {reviewQuickTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            reviewTags.includes(tag)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Additional comments (optional)
                    </p>
                    <Textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience..."
                      className="min-h-20 rounded-xl resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl bg-transparent"
                    onClick={() => setShowReviewModal(false)}
                  >
                    Skip
                  </Button>
                  <Button
                    className="flex-1 rounded-xl"
                    onClick={handleReviewSubmit}
                    disabled={reviewRating === 0}
                  >
                    Submit Review
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ThumbsUp className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-1">
                  Thank you!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your review helps the community find great providers.
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Report Modal */}
        <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
          <DialogContent
            className="max-w-md rounded-2xl"
            aria-describedby={undefined}
          >
            <DialogHeader>
              <DialogTitle>Report an Issue</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Issue Type
                </label>
                <Select value={reportReason} onValueChange={setReportReason}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quality">Poor Quality</SelectItem>
                    <SelectItem value="late">Provider Late</SelectItem>
                    <SelectItem value="incomplete">Incomplete Work</SelectItem>
                    <SelectItem value="damage">Property Damage</SelectItem>
                    <SelectItem value="behavior">Unprofessional</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Details
                </label>
                <Textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Describe the issue..."
                  className="min-h-25 rounded-xl"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl bg-transparent"
                onClick={() => setShowReportModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-700"
                onClick={handleReport}
                disabled={!reportReason}
              >
                Submit
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reschedule Modal */}
        <Dialog
          open={showRescheduleModal}
          onOpenChange={setShowRescheduleModal}
        >
          <DialogContent
            className="max-w-md rounded-2xl"
            aria-describedby={undefined}
          >
            <DialogHeader>
              <DialogTitle>Reschedule Service</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  New Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-transparent rounded-xl"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {rescheduleDate
                        ? format(rescheduleDate, "PPP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={rescheduleDate}
                      onSelect={setRescheduleDate}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  New Time
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setRescheduleTime(time)}
                      className={`p-2 text-xs font-medium rounded-lg border transition-all ${rescheduleTime === time ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl bg-transparent"
                onClick={() => setShowRescheduleModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-xl"
                onClick={handleReschedule}
                disabled={!rescheduleDate || !rescheduleTime}
              >
                Confirm
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ---- Jobs List View ----
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="w-5 h-5 text-primary" />
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
              My Jobs
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Track and manage your service bookings
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {(["active", "scheduled", "completed", "cancelled"] as const).map(
            (tab) => {
              const count = jobs.filter((j) => j.status === tab).length;
              const config = statusConfig[tab];
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`p-3 rounded-xl text-center transition-all ${activeTab === tab ? `${config.bg} ${config.text} shadow-sm` : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
                >
                  <p className="text-xl font-bold">{count}</p>
                  <p className="text-[11px] font-medium capitalize">{tab}</p>
                </button>
              );
            },
          )}
        </div>

        {/* Jobs */}
        <div className="space-y-3">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => {
              const config = statusConfig[job.status];
              const StatusIcon = config.icon;
              return (
                <Card
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                  className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex gap-3 p-3">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0">
                      <Image
                        src={job.image || "/placeholder.svg"}
                        alt={job.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {job.status === "active" &&
                        job.progress !== undefined && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-foreground text-sm">
                            {job.title}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1 shrink-0 ${config.bg} ${config.text}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            <span className="hidden sm:inline capitalize">
                              {job.status}
                            </span>
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1.5">
                          {job.provider}
                        </p>
                        <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1 bg-muted/60 px-1.5 py-0.5 rounded">
                            <Clock className="w-2.5 h-2.5" />
                            {job.date}
                          </span>
                          <span className="flex items-center gap-1 bg-muted/60 px-1.5 py-0.5 rounded">
                            <MapPin className="w-2.5 h-2.5" />
                            {job.location}
                          </span>
                          {job.trackable && job.status === "active" && (
                            <span className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-medium">
                              <Radio className="w-2.5 h-2.5 animate-pulse" />
                              Live
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <p className="font-bold text-sm text-foreground">
                          KES {job.price.toLocaleString()}
                        </p>
                        {job.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-semibold">
                              {job.rating}
                            </span>
                          </div>
                        )}
                        {job.status === "completed" &&
                          !job.reviewed &&
                          !job.rating && (
                            <span className="text-[11px] font-medium text-primary">
                              Needs Review
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="p-12 text-center border-0 shadow-sm">
              <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-base font-semibold text-foreground mb-1">
                No {activeTab} jobs
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {"You don't have any"} {activeTab} jobs right now
              </p>
              <Link href="/customer/services">
                <Button className="rounded-xl">Browse Services</Button>
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
