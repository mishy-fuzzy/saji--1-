"use client";

import React from "react";

import { useState, useRef, useEffect, useCallback } from "react";
import { useLocalization } from "@/lib/hooks/useLocalization";
import { useAuthContext } from "@/lib/auth-context";
import {
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Bell,
  ArrowRight,
  Briefcase,
  Camera,
  Video,
  ImageIcon,
  X,
  MapPin,
  Tag,
  Send,
  MessageCircle,
  Share2,
  Users,
  Settings,
  Mic,
  MicOff,
  Gift,
  RotateCcw,
  Zap,
  Upload,
  Plus,
  Store,
  Sparkles,
  Radio,
  Award,
  ChevronRight,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import NextImage from "next/image";

interface DashboardJob {
  id: string;
  title: string;
  client: string;
  status: "Completed" | "In Progress" | "Pending";
  amount: string;
}

export default function ProviderHomePage() {
  const { currency } = useLocalization();
  const { user } = useAuthContext();
  const providerDisplayName = user?.name?.trim() || "Provider";
  const providerFirstName = providerDisplayName.split(" ")[0] || "Provider";
  const providerInitial = providerFirstName.charAt(0).toUpperCase() || "P";
  const [recentJobs, setRecentJobs] = useState<DashboardJob[]>([]);
  const [isLoadingRecentJobs, setIsLoadingRecentJobs] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showLiveStream, setShowLiveStream] = useState(false);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showEndorsementRequest, setShowEndorsementRequest] = useState(false);
  const [storyType, setStoryType] = useState<"before-after" | "timelapse">(
    "before-after",
  );
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [storyTitle, setStoryTitle] = useState("");
  const [endorsementShop, setEndorsementShop] = useState("");
  const [endorsementMessage, setEndorsementMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamViewers, setStreamViewers] = useState(0);
  const [streamComments, setStreamComments] = useState<
    { user: string; text: string }[]
  >([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [postContent, setPostContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [postLocation, setPostLocation] = useState("");
  const [postTags, setPostTags] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [streamComment, setStreamComment] = useState("");
  const [isLiveStreamActive, setIsLiveStreamActive] = useState(false);
  const [streamTitle, setStreamTitle] = useState(
    "Expert Plumbing Tips - Live Q&A",
  );
  const [streamDescription, setStreamDescription] = useState(
    "Join me for an interactive session on common plumbing issues and solutions",
  );
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [postSuccess, setPostSuccess] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Live stream extras
  const [streamCategory, setStreamCategory] = useState("plumbing");
  const [streamIsPaid, setStreamIsPaid] = useState(false);
  const [streamEntryFee, setStreamEntryFee] = useState("500");
  const [streamDuration, setStreamDuration] = useState(0);
  const [streamEarnings, setStreamEarnings] = useState(0);
  const [peakViewers, setPeakViewers] = useState(0);
  const [receivedGifts, setReceivedGifts] = useState<
    { icon: string; name: string; from: string; amount: number }[]
  >([]);
  const [showStreamEnd, setShowStreamEnd] = useState(false);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const viewerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const giftRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const streamCategories = [
    { id: "plumbing", label: "Plumbing" },
    { id: "electrical", label: "Electrical" },
    { id: "carpentry", label: "Carpentry" },
    { id: "painting", label: "Painting" },
    { id: "general", label: "General Tips" },
    { id: "qa", label: "Q&A Session" },
  ];

  const giftTypes = [
    { icon: "👍", name: "Thumbs Up", amount: 10 },
    { icon: "👏", name: "Clap", amount: 20 },
    { icon: "❤️", name: "Heart", amount: 50 },
    { icon: "🔥", name: "Fire", amount: 100 },
    { icon: "⭐", name: "Star", amount: 200 },
    { icon: "💎", name: "Diamond", amount: 500 },
    { icon: "👑", name: "Crown", amount: 1000 },
    { icon: "🚀", name: "Rocket", amount: 2000 },
  ];

  useEffect(() => {
    const fetchRecentJobs = async () => {
      if (!user?.id) {
        setIsLoadingRecentJobs(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/bookings?providerId=${encodeURIComponent(user.id)}`,
        );
        const payload = await response.json();
        if (!response.ok || !payload?.ok || !Array.isArray(payload.data)) {
          setRecentJobs([]);
          return;
        }

        const mapped: DashboardJob[] = payload.data
          .slice(0, 6)
          .map((booking: any) => {
            const statusRaw = String(
              booking?.status || "pending",
            ).toLowerCase();
            const statusLabel: DashboardJob["status"] =
              statusRaw === "completed"
                ? "Completed"
                : statusRaw === "active"
                  ? "In Progress"
                  : "Pending";

            return {
              id: String(booking?.id || ""),
              title: booking?.service?.name || "Service Job",
              client: booking?.customer?.name || "Customer",
              status: statusLabel,
              amount: `KES ${Number(booking?.amount || 0).toLocaleString()}`,
            };
          });

        setRecentJobs(mapped);
      } catch {
        setRecentJobs([]);
      } finally {
        setIsLoadingRecentJobs(false);
      }
    };

    fetchRecentJobs();
  }, [user?.id]);

  const handleStreamComment = () => {
    if (streamComment.trim()) {
      setStreamComments((prev) => [
        ...prev,
        { user: "You (Host)", text: streamComment },
      ]);
      setStreamComment("");
    }
  };

  const handleShareStream = async () => {
    const shareUrl = `${window.location.origin}/live/${Date.now()}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: streamTitle, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch {
      // Fallback if share or clipboard fails (e.g. sandboxed iframe)
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch {
        /* ignore */
      }
    }
  };

  const handleEndStream = () => {
    if (durationRef.current) clearInterval(durationRef.current);
    if (viewerRef.current) clearInterval(viewerRef.current);
    if (giftRef.current) clearInterval(giftRef.current);
    setIsStreaming(false);
    setShowStreamEnd(true);
  };

  const handlePost = async () => {
    setIsPosting(true);
    // Simulate posting
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsPosting(false);
    setPostSuccess(true);
    setTimeout(() => {
      setPostSuccess(false);
      setShowCreatePost(false);
      setPostContent("");
      setSelectedImages([]);
      setPostLocation("");
      setPostTags([]);
    }, 1500);
  };

  const toggleImageSelection = (img: string) => {
    setSelectedImages((prev) =>
      prev.includes(img) ? prev.filter((i) => i !== img) : [...prev, img],
    );
  };

  // Handle file selection from device
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedImages((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  // Handle camera capture
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(files[0]);
    }
    e.target.value = "";
  };

  // Camera management refs
  const streamRef = useRef<MediaStream | null>(null);
  const busyRef = useRef(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // On mount, detect whether the device has more than one video input (mobile vs laptop)
  useEffect(() => {
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        setHasMultipleCameras(videoInputs.length > 1);
      })
      .catch(() => {
        /* permission not yet granted, will re-check after first stream */
      });
  }, []);

  // Fully stop all tracks and detach from the video element
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraStream(null);
    // Don't null out srcObject -- let the video element stay mounted
  }, []);

  // Acquire a camera stream. Always stops the previous one first with a small
  // delay so the hardware has time to release on mobile devices.
  const startCamera = useCallback(
    async (facing?: "user" | "environment") => {
      if (busyRef.current) return;
      busyRef.current = true;
      setCameraError(null);

      // Stop existing stream and give hardware time to release
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        await new Promise((r) => setTimeout(r, 300));
      }

      const mode = facing ?? (isFrontCamera ? "user" : "environment");

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: true,
        });

        streamRef.current = stream;
        setCameraStream(stream);

        // Assign to the video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // After acquiring the first stream, re-check available devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        setHasMultipleCameras(videoInputs.length > 1);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Camera access denied";
        setCameraError(`Camera not available: ${msg}`);
      } finally {
        busyRef.current = false;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [isFrontCamera],
  );

  // Switch camera -- only works when the device actually has a rear camera
  const switchCamera = useCallback(async () => {
    if (!hasMultipleCameras) return;
    const goToFront = !isFrontCamera;
    setIsFrontCamera(goToFront);
    await startCamera(goToFront ? "user" : "environment");
  }, [hasMultipleCameras, isFrontCamera, startCamera]);

  // Toggle microphone mute
  const toggleMute = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  }, [isMuted]);

  // Open / close lifecycle
  useEffect(() => {
    if (showLiveStream) {
      startCamera();
    } else {
      stopCamera();
      if (durationRef.current) clearInterval(durationRef.current);
      if (viewerRef.current) clearInterval(viewerRef.current);
      if (giftRef.current) clearInterval(giftRef.current);
    }
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLiveStream]);

  const handleStartStream = async () => {
    if (!cameraStream) {
      await startCamera();
    }
    setIsStreaming(true);
    setShowStreamEnd(false);
    setStreamDuration(0);
    setStreamEarnings(0);
    setReceivedGifts([]);

    let initialViewers = Math.max(1, recentJobs.length);
    try {
      const messagesResponse = await fetch("/api/messages", {
        cache: "no-store",
      });
      const messagesPayload = await messagesResponse.json();
      const conversations = Array.isArray(messagesPayload?.data)
        ? messagesPayload.data
        : [];
      initialViewers = Math.max(initialViewers, conversations.length);
    } catch {
      // Keep fallback from recent job activity.
    }

    setStreamViewers(initialViewers);
    setPeakViewers(initialViewers);
    setStreamComments([
      {
        user: "System",
        text: `You are now LIVE with ${initialViewers} active viewers based on your current activity.`,
      },
    ]);

    // Duration timer
    durationRef.current = setInterval(() => {
      setStreamDuration((prev) => prev + 1);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 lg:pb-8">
      {/* Create Post Modal */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="max-w-2xl p-0 bg-card overflow-hidden max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 z-10 bg-card border-b border-border p-4 flex items-center justify-between">
            <button
              onClick={() => setShowCreatePost(false)}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
            <h2 className="text-lg font-semibold text-foreground">
              Create Post
            </h2>
            <Button
              onClick={handlePost}
              disabled={!postContent.trim() || isPosting}
              className="bg-primary hover:bg-primary/90"
            >
              {isPosting ? "Posting..." : postSuccess ? "Posted!" : "Post"}
            </Button>
          </div>

          <div className="p-4 space-y-4">
            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                {providerInitial}
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {providerDisplayName}
                </p>
                <p className="text-sm text-muted-foreground">
                  Electrician - Verified Provider
                </p>
              </div>
            </div>

            {/* Post Content */}
            <Textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Share your work, tips, or updates with the community..."
              className="min-h-[120px] border-0 bg-muted/50 resize-none focus:ring-0"
            />

            {/* Selected Images Preview */}
            {selectedImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {selectedImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-video rounded-lg overflow-hidden bg-muted"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img || "/placeholder.svg"}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() =>
                        setSelectedImages((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                      className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-xs text-white">
                      {idx + 1}/{selectedImages.length}
                    </div>
                  </div>
                ))}
                {/* Add More Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <Plus className="w-8 h-8 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">
                    Add More
                  </span>
                </button>
              </div>
            )}

            {/* Hidden File Inputs */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              className="hidden"
            />

            {/* Add Photo/Video Buttons */}
            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">
                Add photos or videos
              </p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/30 rounded-xl hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-2">
                    <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    Upload from Device
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Select photos or videos
                  </span>
                </button>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/30 rounded-xl hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-2">
                    <Camera className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    Take Photo
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Open camera
                  </span>
                </button>
              </div>

              {/* Sample Images Grid */}
              <p className="text-sm font-medium text-muted-foreground mb-3">
                Or choose from recent
              </p>
              <div className="grid grid-cols-4 gap-2">
                {sampleImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleImageSelection(img)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImages.includes(img)
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-transparent"
                    }`}
                  >
                    <NextImage
                      src={img || "/placeholder.svg"}
                      alt=""
                      fill
                      className="object-cover"
                    />
                    {selectedImages.includes(img) && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-4 border-t border-border pt-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ImageIcon className="w-5 h-5" />
                Gallery
              </button>
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Camera className="w-5 h-5" />
                Camera
              </button>
              <button
                onClick={() =>
                  setPostLocation(postLocation ? "" : "Nairobi, Kenya")
                }
                className={`flex items-center gap-2 text-sm transition-colors ${postLocation ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
              >
                <MapPin className="w-5 h-5" />
                {postLocation || "Location"}
              </button>
              <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Tag className="w-5 h-5" />
                Tag
              </button>
            </div>

            {/* Location Display */}
            {postLocation && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">{postLocation}</span>
                <button onClick={() => setPostLocation("")} className="ml-auto">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Live Stream Modal - Full Featured */}
      <Dialog
        open={showLiveStream}
        onOpenChange={(open) => {
          if (!open) {
            if (isStreaming) handleEndStream();
            setShowLiveStream(false);
            setShowStreamEnd(false);
            stopCamera();
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="!inset-0 !top-0 !left-0 !translate-x-0 !translate-y-0 !max-w-none !w-screen !h-[100dvh] !rounded-none !border-0 !p-0 !gap-0 bg-black overflow-hidden"
        >
          <div className="relative w-full h-full flex flex-col">
            {/* Camera Video Layer -- video is ALWAYS mounted, fills entire viewport */}
            <div className="absolute inset-0 bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-[100dvh] object-cover transition-opacity duration-300 ${cameraStream ? "opacity-100" : "opacity-0"} ${isFrontCamera ? "scale-x-[-1]" : ""}`}
              />

              {/* Placeholder when no stream */}
              {!cameraStream && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-gray-800 to-gray-950">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-white/10 mx-auto mb-3 flex items-center justify-center">
                      <Video className="w-10 h-10 text-white/40" />
                    </div>
                    <p className="text-white/60 text-sm font-medium">
                      Starting Camera...
                    </p>
                  </div>
                </div>
              )}

              {/* Error state */}
              {cameraError && !isStreaming && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
                  <div className="text-center p-6">
                    <Video className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                    <p className="text-white font-medium mb-1">Preview Mode</p>
                    <p className="text-white/60 text-xs mb-3 max-w-xs">
                      {cameraError}
                    </p>
                    <Button
                      onClick={() => startCamera()}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 rounded-xl"
                    >
                      Retry Camera
                    </Button>
                  </div>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50 pointer-events-none" />
            </div>

            {/* === STREAM END SUMMARY === */}
            {showStreamEnd && !isStreaming && (
              <div className="absolute inset-0 z-30 bg-black/90 flex items-center justify-center p-6">
                <div className="text-center max-w-xs w-full">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 mx-auto mb-4 flex items-center justify-center">
                    <Video className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-white text-xl font-bold mb-1">
                    Stream Ended
                  </h3>
                  <p className="text-white/50 text-sm mb-6">
                    Here is your stream summary
                  </p>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-white/10 rounded-xl p-3">
                      <p className="text-white/50 text-[10px] uppercase tracking-wider">
                        Duration
                      </p>
                      <p className="text-white text-lg font-bold">
                        {Math.floor(streamDuration / 60)}:
                        {(streamDuration % 60).toString().padStart(2, "0")}
                      </p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3">
                      <p className="text-white/50 text-[10px] uppercase tracking-wider">
                        Peak Viewers
                      </p>
                      <p className="text-white text-lg font-bold">
                        {peakViewers}
                      </p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3">
                      <p className="text-white/50 text-[10px] uppercase tracking-wider">
                        Gifts Received
                      </p>
                      <p className="text-white text-lg font-bold">
                        {receivedGifts.length}
                      </p>
                    </div>
                    <div className="bg-emerald-500/20 rounded-xl p-3">
                      <p className="text-emerald-300/70 text-[10px] uppercase tracking-wider">
                        Earnings
                      </p>
                      <p className="text-emerald-400 text-lg font-bold">
                        KES {streamEarnings.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setShowStreamEnd(false);
                      }}
                      variant="outline"
                      className="flex-1 rounded-xl bg-transparent text-white border-white/20 hover:bg-white/10"
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() => {
                        setShowStreamEnd(false);
                        handleStartStream();
                      }}
                      className="flex-1 rounded-xl bg-red-500 hover:bg-red-600"
                    >
                      Go Live Again
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* === PRE-STREAM SETUP (not streaming) === */}
            {!isStreaming && !showStreamEnd && (
              <>
                {/* Close */}
                <div className="relative z-10 p-4 flex justify-between items-center">
                  <button
                    onClick={() => {
                      setShowLiveStream(false);
                      stopCamera();
                    }}
                    className="p-2 bg-white/15 rounded-full hover:bg-white/25"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                  <p className="text-white/80 text-sm font-medium">Go Live</p>
                  {hasMultipleCameras ? (
                    <button
                      onClick={switchCamera}
                      className="p-2 bg-white/15 rounded-full hover:bg-white/25"
                    >
                      <RotateCcw className="w-5 h-5 text-white" />
                    </button>
                  ) : (
                    <div className="w-9" />
                  )}
                </div>

                <div className="flex-1" />

                {/* Setup Form */}
                <div className="relative z-10 p-4 space-y-3">
                  <Input
                    value={streamTitle}
                    onChange={(e) => setStreamTitle(e.target.value)}
                    placeholder="Stream title..."
                    className="bg-white/15 border-0 text-white placeholder:text-white/40 rounded-xl h-10 text-sm"
                  />
                  <Input
                    value={streamDescription}
                    onChange={(e) => setStreamDescription(e.target.value)}
                    placeholder="Describe your stream..."
                    className="bg-white/15 border-0 text-white placeholder:text-white/40 rounded-xl h-10 text-sm"
                  />

                  {/* Category pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {streamCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setStreamCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          streamCategory === cat.id
                            ? "bg-red-500 text-white"
                            : "bg-white/15 text-white/70 hover:bg-white/25"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Paid toggle */}
                  <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
                    <div>
                      <p className="text-white text-sm font-medium">
                        Paid Entry
                      </p>
                      <p className="text-white/50 text-[10px]">
                        Charge viewers to join
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {streamIsPaid && (
                        <div className="flex items-center gap-1 bg-white/15 rounded-lg px-2 py-1">
                          <span className="text-white/50 text-xs">KES</span>
                          <input
                            type="number"
                            value={streamEntryFee}
                            onChange={(e) => setStreamEntryFee(e.target.value)}
                            className="bg-transparent text-white text-sm font-medium w-16 outline-none text-right"
                          />
                        </div>
                      )}
                      <button
                        onClick={() => setStreamIsPaid(!streamIsPaid)}
                        className={`w-11 h-6 rounded-full transition-colors flex items-center ${streamIsPaid ? "bg-red-500 justify-end" : "bg-white/20 justify-start"}`}
                      >
                        <span className="w-5 h-5 bg-white rounded-full mx-0.5 shadow-sm" />
                      </button>
                    </div>
                  </div>

                  {/* Camera indicator */}
                  <div className="flex items-center justify-center gap-2 text-white/40 text-xs">
                    <Camera className="w-3.5 h-3.5" />
                    <span>
                      {isFrontCamera ? "Front camera" : "Rear camera"}
                      {hasMultipleCameras ? " - tap rotate to switch" : ""}
                    </span>
                  </div>

                  <Button
                    onClick={handleStartStream}
                    disabled={!streamTitle.trim()}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-5 text-base rounded-xl disabled:opacity-50"
                  >
                    <Radio className="w-5 h-5 mr-2" />
                    Go Live Now
                  </Button>
                </div>
              </>
            )}

            {/* === STREAMING VIEW === */}
            {isStreaming && (
              <>
                {/* Top Bar */}
                <div className="relative z-10 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-red-500">
                      M
                    </div>
                    <div>
                      <p className="text-white font-semibold text-xs leading-tight">
                        {providerDisplayName}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-red-500">
                          {providerInitial}
                        </div>
                        <h1 className="text-3xl font-bold mb-1">
                          Welcome Back, {providerFirstName}!
                        </h1>
                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />{" "}
                          LIVE
                        </span>
                        <span className="text-white/60 text-[10px] flex items-center gap-0.5">
                          <Users className="w-3 h-3" /> {streamViewers}
                        </span>
                        <span className="text-white/40 text-[10px]">
                          {Math.floor(streamDuration / 60)}:
                          {(streamDuration % 60).toString().padStart(2, "0")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {streamEarnings > 0 && (
                      <span className="bg-amber-500/30 text-amber-300 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <Gift className="w-3 h-3" /> KES{" "}
                        {streamEarnings.toLocaleString()}
                      </span>
                    )}
                    <button
                      onClick={() => {
                        handleEndStream();
                      }}
                      className="p-2 bg-red-500/80 rounded-full hover:bg-red-500"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

                {/* Floating Gift Animations */}
                {receivedGifts.length > 0 && (
                  <div className="absolute right-3 top-20 z-20 flex flex-col items-center gap-1">
                    {receivedGifts.slice(-3).map((g, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1 bg-black/40 rounded-full px-2 py-1 animate-bounce"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <span className="text-xl">{g.icon}</span>
                        <span className="text-white text-[10px] font-medium">
                          {g.from}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Right side actions */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-3">
                  {hasMultipleCameras && (
                    <button
                      onClick={switchCamera}
                      className="p-2.5 bg-white/15 rounded-full hover:bg-white/25 transition-colors"
                    >
                      <RotateCcw className="w-5 h-5 text-white" />
                    </button>
                  )}
                  <button
                    onClick={toggleMute}
                    className={`p-2.5 rounded-full transition-colors ${isMuted ? "bg-red-500" : "bg-white/15 hover:bg-white/25"}`}
                  >
                    {isMuted ? (
                      <MicOff className="w-5 h-5 text-white" />
                    ) : (
                      <Mic className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <button
                    onClick={handleShareStream}
                    className="p-2.5 bg-white/15 rounded-full hover:bg-white/25 transition-colors"
                  >
                    <Share2 className="w-5 h-5 text-white" />
                  </button>
                  <div className="text-center">
                    <div className="p-2.5 bg-amber-500/30 rounded-full">
                      <Gift className="w-5 h-5 text-amber-400" />
                    </div>
                    <p className="text-amber-400 text-[9px] font-bold mt-0.5">
                      {receivedGifts.length}
                    </p>
                  </div>
                </div>

                <div className="flex-1" />

                {/* Comments Feed */}
                <div className="relative z-10 px-3 max-h-36 overflow-y-auto mb-1 scrollbar-hide">
                  {streamComments.slice(-10).map((comment, idx) => (
                    <div
                      key={idx}
                      className={`mb-1 px-2.5 py-1 rounded-lg ${comment.user === "System" ? "bg-blue-500/20" : comment.text.includes("sent") ? "bg-amber-500/20" : "bg-black/30"}`}
                    >
                      <span
                        className={`font-semibold text-xs ${comment.user === "System" ? "text-blue-300" : comment.user.includes("Host") ? "text-emerald-400" : "text-white"}`}
                      >
                        {comment.user}
                      </span>
                      <span className="text-white/70 text-xs">
                        {" "}
                        {comment.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bottom Input */}
                <div className="relative z-10 p-3 flex gap-2">
                  <Input
                    value={streamComment}
                    onChange={(e) => setStreamComment(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleStreamComment()
                    }
                    placeholder="Say something to viewers..."
                    className="flex-1 bg-white/15 border-0 text-white placeholder:text-white/40 rounded-full h-9 text-sm"
                  />
                  <Button
                    onClick={handleStreamComment}
                    size="icon"
                    className="bg-primary rounded-full h-9 w-9 flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleEndStream()}
                    size="icon"
                    className="bg-red-500 hover:bg-red-600 rounded-full h-9 w-9 flex-shrink-0"
                  >
                    <X className="w-4 h-4 text-white" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-1">
                Welcome Back, {providerFirstName}!
              </h1>
              <p className="text-blue-100">Here's your performance overview</p>
            </div>
            <Bell className="w-8 h-8 text-blue-100" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8">
        {/* Content Creation Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card
            onClick={() => setShowCreatePost(true)}
            className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 border-0 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Camera className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Create Post</h3>
                <p className="text-blue-100 text-sm">Share photos & videos</p>
              </div>
            </div>
          </Card>

          <Card
            onClick={() => setShowLiveStream(true)}
            className="p-6 bg-gradient-to-br from-red-500 to-red-600 border-0 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform relative">
                <Video className="w-7 h-7 text-white" />
                <span className="absolute -top-1 -right-1 bg-white text-red-500 text-xs px-1.5 py-0.5 rounded font-bold">
                  LIVE
                </span>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Go Live</h3>
                <p className="text-red-100 text-sm">Start streaming now</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card
                key={idx}
                className="p-6 bg-white dark:bg-gray-800 border-0 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Alerts Section */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-gray-800 border-0 rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                    Pending Actions
                  </h2>
                </div>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {alert.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {alert.service}
                        </p>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">
                          {alert.amount}
                        </p>
                      </div>
                      <Button
                        className={`${
                          alert.color === "orange"
                            ? "bg-orange-500 hover:bg-orange-600"
                            : "bg-red-500 hover:bg-red-600"
                        } text-white font-medium h-9 text-sm`}
                      >
                        {alert.action}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-0 rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Button
                onClick={() => setShowCreatePost(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-10 justify-start gap-2"
              >
                <Camera className="w-4 h-4" />
                Create New Post
              </Button>
              <Button
                onClick={() => setShowCreateStory(true)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium h-10 justify-start gap-2"
              >
                <Layers className="w-4 h-4" />
                Create Before/After Story
              </Button>
              <Button
                onClick={() => setShowLiveStream(true)}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-medium h-10 justify-start gap-2"
              >
                <Radio className="w-4 h-4" />
                Start Live Q&A Session
              </Button>
              <Button
                onClick={() => setShowEndorsementRequest(true)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium h-10 justify-start gap-2"
              >
                <Store className="w-4 h-4" />
                Request Shop Endorsement
              </Button>
              <Link href="/provider/jobs">
                <Button
                  variant="outline"
                  className="w-full border-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium h-10 justify-start gap-2 bg-transparent"
                >
                  <TrendingUp className="w-4 h-4" />
                  Find New Jobs
                </Button>
              </Link>
            </div>
          </Card>

          {/* My Vibe Badges */}
          <Card className="bg-white dark:bg-gray-800 border-0 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white">
                My Vibe Badges
              </h3>
              <Award className="w-5 h-5 text-amber-500" />
            </div>
            <div className="space-y-3">
              {myBadges.map((badge) => (
                <div
                  key={badge.key}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    badge.locked
                      ? "bg-gray-100 dark:bg-gray-700/50 opacity-60"
                      : "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{badge.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {badge.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {badge.locked
                          ? `${badge.needed - badge.votes} more votes needed`
                          : `${badge.votes} community votes`}
                      </p>
                    </div>
                  </div>
                  {!badge.locked && (
                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Onboarding Checklist */}
        <Card className="bg-white dark:bg-gray-800 border-0 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Get Started Checklist
              </h2>
              <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                4 of 7 complete
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-1">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: "57%" }}
              />
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Complete all steps to boost your visibility and get more jobs
            </p>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {[
              {
                label: "Complete your profile",
                done: true,
                href: "/provider/profile/account",
              },
              {
                label: "Add skills & work area",
                done: true,
                href: "/provider/profile/skills",
              },
              {
                label: "Upload proof of work",
                done: true,
                href: "/provider/profile/proof",
              },
              {
                label: "Add payment method",
                done: true,
                href: "/provider/profile/payments",
              },
              {
                label: "Get identity verified",
                done: false,
                href: "/provider/profile/verification",
              },
              {
                label: "Add certifications",
                done: false,
                href: "/provider/profile/certifications",
              },
              {
                label: "Set your availability",
                done: false,
                href: "/provider/availability",
              },
            ].map((step, i) => (
              <Link
                key={i}
                href={step.href}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? "bg-blue-600" : "border-2 border-gray-300 dark:border-gray-600"}`}
                >
                  {step.done && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
                <span
                  className={`text-sm flex-1 ${step.done ? "text-gray-500 dark:text-gray-400 line-through" : "text-gray-900 dark:text-white font-medium"}`}
                >
                  {step.label}
                </span>
                {!step.done && (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </Link>
            ))}
          </div>
        </Card>

        {/* Recent Jobs */}
        <Card className="bg-white dark:bg-gray-800 border-0 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Recent Jobs
            </h2>
            <Link
              href="/provider/jobs"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-sm flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Job Title
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoadingRecentJobs ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      Loading recent jobs...
                    </td>
                  </tr>
                ) : recentJobs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      No recent jobs yet.
                    </td>
                  </tr>
                ) : (
                  recentJobs.map((job) => (
                    <tr
                      key={job.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                        {job.title}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {job.client}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            job.status === "In Progress"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                              : job.status === "Completed"
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {job.amount}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Create Story Modal (Before/After or Timelapse) */}
      <Dialog open={showCreateStory} onOpenChange={setShowCreateStory}>
        <DialogContent className="max-w-lg p-0 bg-card overflow-hidden max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 z-10 bg-card border-b border-border p-4 flex items-center justify-between">
            <button
              onClick={() => setShowCreateStory(false)}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
            <h2 className="text-lg font-semibold text-foreground">
              Create Project Story
            </h2>
            <Button
              disabled={!beforeImage || !afterImage || !storyTitle}
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => {
                alert("Story posted to Neighborhood Pulse!");
                setShowCreateStory(false);
                setBeforeImage(null);
                setAfterImage(null);
                setStoryTitle("");
              }}
            >
              Post Story
            </Button>
          </div>

          <div className="p-4 space-y-4">
            {/* Story Type Selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setStoryType("before-after")}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                  storyType === "before-after"
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                    : "border-border"
                }`}
              >
                <Layers className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                <p className="text-sm font-medium">Before & After</p>
              </button>
              <button
                onClick={() => setStoryType("timelapse")}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                  storyType === "timelapse"
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                    : "border-border"
                }`}
              >
                <Video className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                <p className="text-sm font-medium">3D Timelapse</p>
              </button>
            </div>

            {/* Story Title */}
            <Input
              value={storyTitle}
              onChange={(e) => setStoryTitle(e.target.value)}
              placeholder="e.g., Kitchen Renovation - 2 Week Project"
              className="border-border"
            />

            {/* Before/After Image Upload */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm font-medium mb-2 text-muted-foreground">
                  Before
                </p>
                <label className="block aspect-video rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-purple-500 cursor-pointer overflow-hidden transition-colors">
                  {beforeImage ? (
                    <img
                      src={beforeImage || "/placeholder.svg"}
                      alt="Before"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                      <Camera className="w-8 h-8 mb-2" />
                      <span className="text-xs">Add Photo</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () =>
                          setBeforeImage(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
              <div>
                <p className="text-sm font-medium mb-2 text-muted-foreground">
                  After
                </p>
                <label className="block aspect-video rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-purple-500 cursor-pointer overflow-hidden transition-colors">
                  {afterImage ? (
                    <img
                      src={afterImage || "/placeholder.svg"}
                      alt="After"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                      <Camera className="w-8 h-8 mb-2" />
                      <span className="text-xs">Add Photo</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () =>
                          setAfterImage(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
              <p className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-1">
                Tips for great stories:
              </p>
              <ul className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                <li>- Same angle for before & after photos</li>
                <li>- Good lighting shows your work better</li>
                <li>- Stories appear in the Neighborhood Pulse feed</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Endorsement Modal */}
      <Dialog
        open={showEndorsementRequest}
        onOpenChange={setShowEndorsementRequest}
      >
        <DialogContent className="max-w-lg p-0 bg-card overflow-hidden max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 z-10 bg-card border-b border-border p-4 flex items-center justify-between">
            <button
              onClick={() => setShowEndorsementRequest(false)}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
            <h2 className="text-lg font-semibold text-foreground">
              Request Endorsement
            </h2>
            <Button
              disabled={!endorsementShop || !endorsementMessage}
              className="bg-amber-500 hover:bg-amber-600"
              onClick={() => {
                alert("Endorsement request sent!");
                setShowEndorsementRequest(false);
                setEndorsementShop("");
                setEndorsementMessage("");
              }}
            >
              Send Request
            </Button>
          </div>

          <div className="p-4 space-y-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <Store className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    Shopkeeper Endorsements
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    When a local shop owner endorses you, it shows up on your
                    profile as a trusted badge. Customers trust these
                    endorsements more than standard reviews.
                  </p>
                </div>
              </div>
            </div>

            {/* Select Shop */}
            <div>
              <p className="text-sm font-medium mb-2 text-foreground">
                Select a shop you work with:
              </p>
              <div className="space-y-2">
                {nearbyShops.map((shop) => (
                  <button
                    key={shop.id}
                    onClick={() => setEndorsementShop(shop.name)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                      endorsementShop === shop.name
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                        : "border-border hover:border-amber-300"
                    }`}
                  >
                    <img
                      src={shop.avatar || "/placeholder.svg"}
                      alt={shop.owner}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {shop.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {shop.owner} - {shop.location}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-muted rounded-full">
                      {shop.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Message to Shop Owner */}
            <div>
              <p className="text-sm font-medium mb-2 text-foreground">
                Your message to the shop owner:
              </p>
              <Textarea
                value={endorsementMessage}
                onChange={(e) => setEndorsementMessage(e.target.value)}
                placeholder="Hi, I've been purchasing supplies from your shop for 3 years. I'd appreciate if you could endorse me as a trusted specialist..."
                className="min-h-[100px] border-border"
              />
            </div>

            {/* What happens next */}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm font-medium text-foreground mb-2">
                What happens next?
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-3 h-3" />
                  Shop owner receives your endorsement request
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-3 h-3" />
                  They can write a personalized endorsement
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-3 h-3" />
                  Endorsement appears on your public profile
                </li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const sampleImages: string[] = [];

// Nearby shops for endorsement requests
const nearbyShops: any[] = [];

// Vibe badges the provider has earned
const myBadges: any[] = [];

// Stats array
const stats = [
  {
    icon: Briefcase,
    label: "Active Jobs",
    value: "0",
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
  },
  {
    icon: CheckCircle2,
    label: "Completed",
    value: "0",
    color: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300",
  },
  {
    icon: Clock,
    label: "In Progress",
    value: "0",
    color:
      "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300",
  },
  {
    icon: DollarSign,
    label: "Earnings",
    value: "KES 0",
    color:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300",
  },
];

// Alerts array
const alerts: any[] = [];
