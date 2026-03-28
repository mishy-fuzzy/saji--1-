"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Search,
  Star,
  MapPin,
  CheckCircle,
  Calendar,
  Briefcase,
  Video,
  ShoppingBag,
  Filter,
  X,
  Phone,
  MessageCircle,
  Award,
  Users,
  Store,
  Clock,
  PlayCircle,
  ExternalLink,
  Heart,
  Share2,
  Shield,
  ImageIcon,
  Navigation,
  ChevronDown,
  LocateFixed,
} from "lucide-react";
import NextImage from "next/image";
import Link from "next/link";

// --- Types ---
interface Specialist {
  id: number;
  providerId?: string;
  email?: string;
  name: string;
  verified: boolean;
  available: boolean;
  rating: number;
  reviews: number;
  skills: string[];
  avatar: string;
  location: { lat: number; lng: number; name: string };
  distance: string;
  bio: string;
  phone: string;
  hourlyRate: number;
  hiredByNeighbors: { name: string; times: number; avatar: string }[];
  badges: string[];
  endorsements: { shop: string; owner: string; text: string; avatar: string }[];
  completedJobs: number;
  yearsExperience: number;
  workSamples?: { type: string; title: string; thumbnail: string }[];
  shop?: { name: string; products: number };
  videos?: { title: string; duration: string; thumbnail: string }[];
}

// --- Data ---
const vibeBadges: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  "great-teacher": {
    label: "Great Teacher",
    color:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    icon: "📚",
  },
  "cleanest-workspace": {
    label: "Cleanest Workspace",
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    icon: "✨",
  },
  "local-legend": {
    label: "Local Legend",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    icon: "🏆",
  },
  "fast-responder": {
    label: "Fast Responder",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    icon: "⚡",
  },
  "budget-friendly": {
    label: "Budget Friendly",
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    icon: "💰",
  },
};

const skills = [
  "All",
  "Electrician",
  "Plumber",
  "Carpenter",
  "Painter",
  "Cleaner",
  "Landscaper",
  "HVAC",
  "Roofer",
  "Mason",
  "Welder",
];

export default function FindSpecialistsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("Detecting...");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [vettedOnly, setVettedOnly] = useState(false);
  const [selectedSpecialist, setSelectedSpecialist] =
    useState<Specialist | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [profileTab, setProfileTab] = useState("overview");
  const [isFavorite, setIsFavorite] = useState(false);
  const [liveSpecialists, setLiveSpecialists] = useState<Specialist[]>([]);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setSelectedLocation("Anywhere");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => setSelectedLocation("Near You"),
      () => setSelectedLocation("Anywhere"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }, []);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  useEffect(() => {
    const loadSpecialists = async () => {
      try {
        const params = new URLSearchParams({
          q: searchQuery,
          skill: selectedSkill,
          availableOnly: String(availableOnly),
        });
        const response = await fetch(
          `/api/specialists/search?${params.toString()}`,
          {
            cache: "no-store",
          },
        );
        const payload = await response.json();
        setLiveSpecialists(Array.isArray(payload?.data) ? payload.data : []);
      } catch {
        setLiveSpecialists([]);
      }
    };

    loadSpecialists();
    const intervalId = window.setInterval(loadSpecialists, 25000);
    return () => window.clearInterval(intervalId);
  }, [searchQuery, selectedSkill, availableOnly]);

  const filtered = liveSpecialists.filter((s) => {
    if (
      searchQuery &&
      !s.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !s.skills.some((sk) =>
        sk.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    )
      return false;
    if (vettedOnly && !s.verified) return false;
    if (availableOnly && !s.available) return false;
    if (
      selectedSkill !== "All" &&
      !s.skills.some((sk) =>
        sk.toLowerCase().includes(selectedSkill.toLowerCase()),
      )
    )
      return false;
    return true;
  });

  const renderBadge = (badgeKey: string) => {
    const badge = vibeBadges[badgeKey];
    if (!badge) return null;
    return (
      <span
        key={badgeKey}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}
      >
        <span>{badge.icon}</span>
        {badge.label}
      </span>
    );
  };

  const handleShareSpecialist = async () => {
    if (!selectedSpecialist) return;

    const url = `${window.location.origin}/customer/find-specialists`;
    const shareData = {
      title: `${selectedSpecialist.name} on SAJI`,
      text: `Check out ${selectedSpecialist.name}, rated ${selectedSpecialist.rating} stars on SAJI.`,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        alert("Profile link copied to clipboard");
      }
    } catch {
      // Ignore cancellation/errors from native share UI.
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-card/95 backdrop-blur-lg border-b border-border/50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-muted rounded-xl transition-colors lg:hidden"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">
                Find Specialists
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <LocateFixed className="w-3 h-3" /> {selectedLocation} --{" "}
                {filtered.length} specialists found
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2.5 bg-muted rounded-xl hover:bg-muted/80 transition-colors relative"
            >
              <Filter className="w-4 h-4 text-foreground" />
              {(vettedOnly || availableOnly) && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full" />
              )}
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl border-0 bg-muted text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Skill Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {skills.map((skill) => (
              <button
                key={skill}
                onClick={() => setSelectedSkill(skill)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedSkill === skill
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {skill}
              </button>
            ))}
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 pt-3 border-t border-border/50 mt-3">
              <button
                onClick={() => setAvailableOnly(!availableOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  availableOnly
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${availableOnly ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
                />
                Available Now
              </button>
              <button
                onClick={() => setVettedOnly(!vettedOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  vettedOnly
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Shield className="w-3 h-3" />
                Verified Only
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        {filtered.length === 0 ? (
          <Card className="p-10 text-center border-0 shadow-sm">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold text-foreground mb-1">
              No specialists found
            </p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or search term
            </p>
          </Card>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {filtered.map((s) => (
              <Card
                key={s.id}
                onClick={() => {
                  setSelectedSpecialist(s);
                  setProfileTab("overview");
                  setIsFavorite(false);
                }}
                className="p-4 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex gap-3.5">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 lg:w-18 lg:h-18 rounded-2xl overflow-hidden ring-2 ring-border group-hover:ring-primary/40 transition-all">
                      <NextImage
                        src={s.avatar}
                        alt={s.name}
                        width={72}
                        height={72}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    {s.available && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-[3px] border-card flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h3 className="font-bold text-foreground text-sm lg:text-base truncate">
                        {s.name}
                      </h3>
                      {s.verified && (
                        <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-500 flex-shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-foreground">
                          {s.rating}
                        </span>
                        <span>({s.reviews})</span>
                      </span>
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" />
                        {s.distance}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Briefcase className="w-3 h-3" />
                        {s.completedJobs}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-2">
                      {s.skills.map((sk, i) => (
                        <span
                          key={i}
                          className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-md font-medium"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>

                    {s.hiredByNeighbors.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400">
                        <div className="flex -space-x-1.5">
                          {s.hiredByNeighbors.slice(0, 2).map((n, i) => (
                            <div
                              key={i}
                              className="w-5 h-5 rounded-full overflow-hidden border-2 border-card"
                            >
                              <NextImage
                                src={n.avatar}
                                alt=""
                                width={20}
                                height={20}
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                        <span className="font-medium">
                          {s.hiredByNeighbors[0].name} hired{" "}
                          {s.hiredByNeighbors[0].times}x
                        </span>
                      </div>
                    )}

                    {s.badges.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {s.badges.slice(0, 2).map((b) => renderBadge(b))}
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-foreground text-base lg:text-lg">
                      KES {s.hourlyRate.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-muted-foreground">/hour</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Specialist Profile Modal */}
      <Dialog
        open={!!selectedSpecialist}
        onOpenChange={() => setSelectedSpecialist(null)}
      >
        <DialogContent className="max-w-lg p-0 overflow-hidden h-[92vh] max-h-[850px] flex flex-col">
          {selectedSpecialist && (
            <>
              {/* Hero */}
              <div className="relative h-32 bg-gradient-to-br from-primary via-primary/80 to-blue-600 flex-shrink-0">
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedSpecialist(null)}
                    className="p-2 bg-black/20 hover:bg-black/40 rounded-xl transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsFavorite(!isFavorite)}
                      className="p-2 bg-black/20 hover:bg-black/40 rounded-xl transition-colors"
                    >
                      <Heart
                        className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : "text-white"}`}
                      />
                    </button>
                    <button
                      onClick={handleShareSpecialist}
                      className="p-2 bg-black/20 hover:bg-black/40 rounded-xl transition-colors"
                    >
                      <Share2 className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Avatar Overlap */}
              <div className="px-5 -mt-12 relative z-10 flex-shrink-0">
                <div className="flex items-end gap-4">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-card shadow-lg">
                    <NextImage
                      src={selectedSpecialist.avatar}
                      alt={selectedSpecialist.name}
                      width={96}
                      height={96}
                      className="object-cover"
                    />
                  </div>
                  {selectedSpecialist.available && (
                    <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 px-3 py-1 rounded-full font-medium mb-1">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />{" "}
                      Available Now
                    </span>
                  )}
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="px-5 pt-3 pb-5 space-y-4">
                  {/* Name & Stats */}
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h2 className="text-xl font-bold text-foreground">
                        {selectedSpecialist.name}
                      </h2>
                      {selectedSpecialist.verified && (
                        <span className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                          <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                            Verified
                          </span>
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">
                      {selectedSpecialist.skills.join(" | ")}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-2.5">
                      <span className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-lg text-sm">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-foreground">
                          {selectedSpecialist.rating}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({selectedSpecialist.reviews})
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5" />
                        {selectedSpecialist.completedJobs} jobs
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {selectedSpecialist.yearsExperience} yrs
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {selectedSpecialist.distance}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-primary mt-2.5">
                      KES {selectedSpecialist.hourlyRate.toLocaleString()}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        / hour
                      </span>
                    </p>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      {
                        icon: Phone,
                        label: "Call",
                        bg: "bg-emerald-50 dark:bg-emerald-900/20",
                        iconBg: "bg-emerald-500",
                        textColor: "text-emerald-700 dark:text-emerald-300",
                        href: `tel:${selectedSpecialist.phone}`,
                      },
                      {
                        icon: MessageCircle,
                        label: "Chat",
                        bg: "bg-blue-50 dark:bg-blue-900/20",
                        iconBg: "bg-blue-500",
                        textColor: "text-blue-700 dark:text-blue-300",
                        href: `/customer/messages?provider=${selectedSpecialist.providerId}`,
                      },
                      {
                        icon: Video,
                        label: "Video",
                        bg: "bg-violet-50 dark:bg-violet-900/20",
                        iconBg: "bg-violet-500",
                        textColor: "text-violet-700 dark:text-violet-300",
                      },
                      {
                        icon: Calendar,
                        label: "Book",
                        bg: "bg-orange-50 dark:bg-orange-900/20",
                        iconBg: "bg-orange-500",
                        textColor: "text-orange-700 dark:text-orange-300",
                      },
                    ].map((action, idx) => {
                      const Icon = action.icon;
                      const Wrapper = action.href ? Link : ("button" as any);
                      return (
                        <Wrapper
                          key={idx}
                          href={action.href}
                          className={`flex flex-col items-center gap-1.5 p-3 ${action.bg} rounded-xl hover:opacity-80 transition-opacity`}
                        >
                          <div
                            className={`w-9 h-9 ${action.iconBg} rounded-full flex items-center justify-center`}
                          >
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <span
                            className={`text-[11px] font-medium ${action.textColor}`}
                          >
                            {action.label}
                          </span>
                        </Wrapper>
                      );
                    })}
                  </div>

                  {/* Tabs */}
                  <Tabs
                    value={profileTab}
                    onValueChange={setProfileTab}
                    className="w-full"
                  >
                    <TabsList className="w-full grid grid-cols-4 h-10 bg-muted rounded-xl p-1">
                      <TabsTrigger
                        value="overview"
                        className="rounded-lg text-xs"
                      >
                        Overview
                      </TabsTrigger>
                      <TabsTrigger
                        value="portfolio"
                        className="rounded-lg text-xs"
                      >
                        Portfolio
                      </TabsTrigger>
                      <TabsTrigger
                        value="videos"
                        className="rounded-lg text-xs"
                      >
                        Videos
                      </TabsTrigger>
                      <TabsTrigger value="shop" className="rounded-lg text-xs">
                        Shop
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-3 space-y-3">
                      <div className="bg-muted/50 rounded-xl p-4">
                        <h3 className="font-semibold text-foreground text-sm mb-1.5">
                          About
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {selectedSpecialist.bio}
                        </p>
                      </div>
                      {selectedSpecialist.badges.length > 0 && (
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4">
                          <h3 className="font-semibold text-foreground text-sm mb-2 flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-amber-500" />
                            Community Badges
                          </h3>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedSpecialist.badges.map((b) =>
                              renderBadge(b),
                            )}
                          </div>
                        </div>
                      )}
                      {selectedSpecialist.hiredByNeighbors.length > 0 && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4">
                          <h3 className="font-semibold text-foreground text-sm mb-2 flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-blue-600" />
                            Hired by Your Neighbors
                          </h3>
                          <div className="space-y-2">
                            {selectedSpecialist.hiredByNeighbors.map(
                              (n, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2.5"
                                >
                                  <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white dark:ring-gray-800">
                                    <NextImage
                                      src={n.avatar}
                                      alt={n.name}
                                      width={32}
                                      height={32}
                                      className="object-cover"
                                    />
                                  </div>
                                  <div>
                                    <span className="font-medium text-foreground text-sm">
                                      {n.name}
                                    </span>
                                    <p className="text-[11px] text-muted-foreground">
                                      Hired {n.times} times
                                    </p>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                      {selectedSpecialist.endorsements.length > 0 && (
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4">
                          <h3 className="font-semibold text-foreground text-sm mb-2 flex items-center gap-1.5">
                            <Store className="w-4 h-4 text-emerald-600" />
                            Endorsements
                          </h3>
                          {selectedSpecialist.endorsements.map((e, idx) => (
                            <div key={idx} className="flex gap-2.5">
                              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                                <NextImage
                                  src={e.avatar}
                                  alt={e.owner}
                                  width={40}
                                  height={40}
                                  className="object-cover"
                                />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground text-sm">
                                  {e.shop}
                                </p>
                                <p className="text-[11px] text-muted-foreground mb-1">
                                  by {e.owner}
                                </p>
                                <p className="text-sm text-foreground italic leading-relaxed">{`"${e.text}"`}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="portfolio" className="mt-3">
                      {selectedSpecialist.workSamples &&
                      selectedSpecialist.workSamples.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {selectedSpecialist.workSamples.map((sample, idx) => (
                            <div
                              key={idx}
                              className="relative aspect-video rounded-xl overflow-hidden group cursor-pointer"
                            >
                              <NextImage
                                src={sample.thumbnail}
                                alt={sample.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                              <p className="absolute bottom-2 left-2 right-2 text-white text-xs font-medium truncate">
                                {sample.title}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-muted/50 rounded-xl">
                          <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No work samples yet
                          </p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="videos" className="mt-3">
                      {selectedSpecialist.videos &&
                      selectedSpecialist.videos.length > 0 ? (
                        <div className="space-y-2">
                          {selectedSpecialist.videos.map((video, idx) => (
                            <div
                              key={idx}
                              className="flex gap-3 p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors cursor-pointer"
                            >
                              <div className="relative w-28 h-18 rounded-lg overflow-hidden flex-shrink-0">
                                <NextImage
                                  src={video.thumbnail}
                                  alt={video.title}
                                  fill
                                  className="object-cover"
                                />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                  <PlayCircle className="w-8 h-8 text-white" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground text-sm truncate">
                                  {video.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {video.duration}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-muted/50 rounded-xl">
                          <Video className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No videos yet
                          </p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="shop" className="mt-3">
                      {selectedSpecialist.shop ? (
                        <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-bold text-foreground">
                                {selectedSpecialist.shop.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {selectedSpecialist.shop.products} products
                              </p>
                            </div>
                            <Button size="sm" className="gap-1.5 rounded-xl">
                              <ExternalLink className="w-3.5 h-3.5" />
                              Visit
                            </Button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {[1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className="aspect-square rounded-lg bg-muted/60 flex items-center justify-center"
                              >
                                <ShoppingBag className="w-6 h-6 text-muted-foreground" />
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-muted/50 rounded-xl">
                          <Store className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No shop linked
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              {/* Fixed Bottom Actions */}
              <div className="flex-shrink-0 p-4 border-t border-border bg-card">
                <div className="flex gap-2.5">
                  <Button
                    variant="outline"
                    className="flex-1 h-11 gap-2 bg-transparent rounded-xl text-sm"
                  >
                    <Calendar className="w-4 h-4" /> Schedule
                  </Button>
                  <Button className="flex-1 h-11 gap-2 rounded-xl shadow-lg shadow-primary/20 text-sm">
                    <Briefcase className="w-4 h-4" /> Book Now
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
