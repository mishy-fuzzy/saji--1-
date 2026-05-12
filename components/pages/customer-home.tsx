"use client";

import { useEffect, useRef, useState } from "react";
import { useLocalization } from "@/lib/hooks/useLocalization";
import { useAuthContext } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Play,
  X,
  Send,
  Gift,
  Clock,
  Eye,
  Star,
  Sparkles,
  Radio,
  ArrowRight,
  Camera,
  Store,
  Users,
  MapPin,
  Wrench,
  ShieldCheck,
  AlertTriangle,
  Truck,
  Package,
  ChevronRight,
  BriefcaseBusiness,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  BriefcaseBusiness,
  Wrench,
  Sparkles,
  Store,
  Users,
  MapPin,
  Camera,
  Truck,
  ShieldCheck,
  Package,
};

// --- Sub-components ---

function AISearchBar({
  searchQuery,
  setSearchQuery,
}: {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
}) {
  return (
    <div className="mb-5">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Describe what you need (AI assisted)"
          className="pl-12 pr-24 h-12 rounded-2xl border-2 border-border focus:border-primary bg-card text-sm"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20"
          >
            <Camera className="w-4 h-4 text-primary" />
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-1.5 ml-1">
        Recent searches
      </p>
    </div>
  );
}

function QuickFixCard() {
  return (
    <Card className="mb-4 overflow-hidden border-0 bg-gradient-to-r from-sky-600 via-sky-500 to-teal-500 dark:from-sky-800 dark:via-sky-700 dark:to-teal-700">
      <div className="flex items-center gap-4 p-4 lg:p-6">
        <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <Wrench className="w-7 h-7 lg:w-8 lg:h-8 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-white text-lg lg:text-xl">
              Quick Fix
            </h3>
            <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              LIVE
            </span>
          </div>
          <p className="text-white/90 text-sm">5-Min ETA</p>
          <p className="text-white/80 text-xs flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Payment secured
          </p>
        </div>
        <Button className="hidden sm:flex bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl h-10 text-sm px-6">
          HIRE NOW
        </Button>
      </div>
      <div className="px-4 pb-4 sm:hidden">
        <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl h-10 text-sm">
          HIRE NOW
        </Button>
      </div>
    </Card>
  );
}

type EmergencyAlert = {
  title: string;
  category: string;
  message: string;
};

function EmergencyBanner({ emergency }: { emergency: EmergencyAlert | null }) {
  if (!emergency) return null;
  const details = [emergency.category, emergency.message]
    .filter(Boolean)
    .join(" - ");

  return (
    <div className="mb-5 relative overflow-hidden rounded-2xl border-2 border-red-400/60 dark:border-red-500/40 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex items-center gap-2 flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <span className="font-bold text-red-600 dark:text-red-400 text-sm">
            EMERGENCY: {emergency.title}
          </span>
        </div>
        <div className="flex-1 flex items-center justify-end">
          <svg
            viewBox="0 0 120 30"
            className="w-24 h-6 text-red-500 dark:text-red-400"
          >
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points="0,15 20,15 30,5 40,25 50,10 60,20 70,15 80,15 90,5 100,20 110,15 120,15"
              className="animate-emergency-pulse"
            />
          </svg>
        </div>
      </div>
      {details ? (
        <p className="text-xs text-muted-foreground px-4 pb-2.5 text-right">
          {details}
        </p>
      ) : null}
    </div>
  );
}

function CustomerHomeSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-5 space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-12 w-full rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <Skeleton className="h-52 w-full rounded-2xl" />
          <Skeleton className="h-52 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

function LiveNowAvatars({
  onJoinLive,
  providers,
}: {
  onJoinLive?: (provider: any) => void;
  providers: any[];
}) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-bold text-foreground mb-3 tracking-wide">
        LIVE NOW
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {providers.map((provider) => {
          const canJoin =
            typeof provider?.joinFee === "number" && typeof onJoinLive === "function";
          const Container = canJoin ? "button" : "div";
          return (
            <Container
              key={provider.id}
              onClick={canJoin ? () => onJoinLive?.(provider) : undefined}
              className="flex flex-col items-center flex-shrink-0 group"
            >
              <div className="relative">
                <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full p-[3px] bg-gradient-to-tr from-red-500 via-pink-500 to-orange-400">
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-card">
                    <Image
                      src={provider.avatar || "/placeholder.svg"}
                      alt={provider.name || ""}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-red-500 text-white text-[8px] font-bold rounded-full leading-none">
                  LIVE
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground mt-2 truncate w-16 lg:w-20 text-center group-hover:text-foreground transition-colors">
                {provider.name || ""}
              </span>
            </Container>
          );
        })}
      </div>
    </div>
  );
}

function FeaturedShopCard({ shop }: { shop: any }) {
  const hasRating = typeof shop?.rating === "number";
  const hasReviews = typeof shop?.reviews === "number";
  const deliveryPercent =
    typeof shop?.deliveryPercent === "number"
      ? `${shop.deliveryPercent}%`
      : null;
  return (
    <Card className="overflow-hidden border border-border hover:shadow-md transition-shadow">
      <div className="relative h-28 lg:h-36">
        <Image
          src={shop.image || "/placeholder.svg"}
          alt={shop.name || ""}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        {shop.isOpen ? (
          <Badge className="absolute top-2 left-2 bg-emerald-500 hover:bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 border-0">
            OPEN NOW
          </Badge>
        ) : null}
        {shop.hasSale && (
          <Badge className="absolute top-2 right-2 bg-amber-500 hover:bg-amber-500 text-white text-[10px] px-1.5 py-0.5 border-0 flex items-center gap-0.5">
            <Package className="w-3 h-3" /> SALE
          </Badge>
        )}
      </div>
      <div className="p-3">
        <h4 className="font-semibold text-foreground text-sm truncate">
          {shop.name || ""}
        </h4>
        {hasRating && hasReviews ? (
          <div className="flex items-center gap-1.5 mt-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${i < Math.floor(shop.rating) ? "fill-amber-400 text-amber-400" : i < shop.rating ? "fill-amber-400/50 text-amber-400" : "text-muted"}`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{shop.reviews}</span>
          </div>
        ) : null}
        {deliveryPercent || shop.matchedByAI ? (
          <div className="flex items-center justify-between mt-2">
            {deliveryPercent ? (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Truck className="w-3 h-3" /> {deliveryPercent} Delivers
              </span>
            ) : (
              <span />
            )}
            {shop.matchedByAI ? (
              <span className="text-[10px] text-primary flex items-center gap-0.5">
                <Sparkles className="w-3 h-3" /> Saji AI
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function FeaturedShopsSection({ shops }: { shops: any[] }) {
  if (!shops.length) return null;
  const hasHighlightRating =
    typeof shops[0]?.rating === "number" && typeof shops[0]?.reviews === "number";
  const highlightDeliveryPercent =
    typeof shops[0]?.deliveryPercent === "number"
      ? `${shops[0].deliveryPercent}%`
      : null;
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-foreground tracking-wide">
          FEATURED SHOPS
        </h2>
        <Link
          href="/customer/services"
          className="text-sm text-primary font-medium flex items-center gap-0.5"
        >
          See All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Desktop: 2-column layout with highlight + smaller cards side-by-side. Mobile: stacked */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-4">
        {/* Highlight card (first shop) */}
        <Card className="overflow-hidden border border-border mb-4 lg:mb-0 lg:row-span-2">
          <div className="relative h-36 lg:h-52">
            <Image
              src={shops[0].image || "/placeholder.svg"}
              alt={shops[0].name || ""}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            {shops[0].isOpen ? (
              <Badge className="absolute top-3 left-3 bg-emerald-500 hover:bg-emerald-500 text-white text-xs px-2 py-0.5 border-0">
                OPEN NOW
              </Badge>
            ) : null}
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-foreground">
                  {shops[0].name || ""}
                </h3>
                {hasHighlightRating ? (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < Math.floor(shops[0].rating) ? "fill-amber-400 text-amber-400" : "text-muted"}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {shops[0].reviews}
                    </span>
                  </div>
                ) : null}
              </div>
              {shops[0].hasSale && (
                <Badge className="bg-amber-500 hover:bg-amber-500 text-white text-xs border-0 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" /> SALE
                </Badge>
              )}
            </div>
            {highlightDeliveryPercent || shops[0].matchedByAI ? (
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                {highlightDeliveryPercent ? (
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" /> {highlightDeliveryPercent} Delivers
                  </span>
                ) : (
                  <span />
                )}
                {shops[0].matchedByAI ? (
                  <span className="text-xs text-primary flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Matched by Saji AI
                  </span>
                ) : null}
              </div>
            ) : null}
            <Button className="w-full mt-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl h-9 text-sm">
              View Shop
            </Button>
          </div>
        </Card>

        {/* Grid of smaller shop cards */}
        <div className="grid grid-cols-2 gap-3">
          {shops.slice(1).map((shop) => (
            <FeaturedShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      </div>

      {/* Live provider bubble */}
      <LiveProviderBubble />
    </div>
  );
}

function LiveProviderBubble() {
  return null;
}

function ServiceCategoriesGrid({
  categories,
}: {
  categories: any[];
}) {
  const fallbackColor =
    "bg-slate-100 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300";

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 mb-6">
      {categories.map((category) => {
        const Icon = category?.iconName
          ? CATEGORY_ICON_MAP[category.iconName] || BriefcaseBusiness
          : BriefcaseBusiness;
        return (
          <Link
            key={category.id}
            href={`/customer/services?category=${category.name.toLowerCase()}`}
            className={`${category.color || fallbackColor} rounded-2xl p-3 flex flex-col items-center text-center hover:scale-105 transition-transform`}
          >
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-white/60 dark:bg-white/10 flex items-center justify-center mb-2">
              <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
            <p className="text-xs font-semibold leading-tight">
              {category.name}
            </p>
            {category.type ? (
              <p className="text-[10px] opacity-70 mt-0.5">
                {category.type}
              </p>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

// --- Main Component ---

export function CustomerHome() {
  const { formatCurrency } = useLocalization();
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Story / Live stream modals
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [joinedLive, setJoinedLive] = useState<any>(null);
  const [liveComment, setLiveComment] = useState("");
  const [liveComments, setLiveComments] = useState<
    { user: string; text: string; gift?: string }[]
  >([]);
  const [showJoinConfirm, setShowJoinConfirm] = useState<any>(null);
  const [showGiftShop, setShowGiftShop] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [sentGifts, setSentGifts] = useState<{ name: string; icon: string }[]>(
    [],
  );
  const [liveProvidersData, setLiveProvidersData] = useState<any[]>([]);
  const [featuredShopsData, setFeaturedShopsData] = useState<any[]>([]);
  const [serviceCategoriesData, setServiceCategoriesData] = useState<any[]>([]);
  const [projectStoriesData, setProjectStoriesData] = useState<any[]>([]);
  const [liveExpertsData, setLiveExpertsData] = useState<any[]>([]);
  const [liveGifts, setLiveGifts] = useState<any[]>([]);
  const [emergencyAlertData, setEmergencyAlertData] =
    useState<EmergencyAlert | null>(null);
  const hasShownLoadError = useRef(false);
  const initialLoadRef = useRef(true);

  const fetchWithRetry = async (
    url: string,
    retries = 2,
    delayMs = 400,
  ): Promise<Response> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Request failed (${response.status}) for ${url}`);
        }
        return response;
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        await new Promise((resolve) =>
          window.setTimeout(resolve, delayMs * (attempt + 1)),
        );
      }
    }

    throw new Error(`Request retries exhausted for ${url}`);
  };

  useEffect(() => {
    const loadHome = async () => {
      try {
        const [homeRes, walletRes, giftsRes] = await Promise.all([
          fetchWithRetry("/api/customer/home"),
          fetchWithRetry("/api/wallet"),
          fetchWithRetry("/api/gifts"),
        ]);

        const homePayload = await homeRes.json();
        const walletPayload = await walletRes.json();
        const giftsPayload = await giftsRes.json();
        const data = homePayload?.data || {};

        if (giftsRes.ok && Array.isArray(giftsPayload?.data)) {
          setLiveGifts(giftsPayload.data);
        }

        setLiveProvidersData(
          Array.isArray(data.liveProviders) ? data.liveProviders : [],
        );
        setFeaturedShopsData(
          Array.isArray(data.featuredShops) ? data.featuredShops : [],
        );
        setServiceCategoriesData(
          Array.isArray(data.serviceCategories) ? data.serviceCategories : [],
        );
        setLiveExpertsData(
          Array.isArray(data.liveExperts) ? data.liveExperts : [],
        );
        setProjectStoriesData(
          Array.isArray(data.projectStories) ? data.projectStories : [],
        );
        setEmergencyAlertData(data.emergencyAlert || null);

        if (walletRes.ok && walletPayload?.ok) {
          setWalletBalance(Number(walletPayload?.data?.balance || 0));
        }

        hasShownLoadError.current = false;
      } catch {
        if (!hasShownLoadError.current) {
          hasShownLoadError.current = true;
          toast({
            title: "Unable to refresh home data",
            description:
              "We couldn't load live data right now. Please check your connection and try again.",
            variant: "destructive",
          });
        }
      } finally {
        if (initialLoadRef.current) {
          initialLoadRef.current = false;
          setIsInitialLoading(false);
        }
      }
    };

    loadHome();
    const intervalId = window.setInterval(loadHome, 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  const handleJoinLive = (stream: any) => {
    const joinFee =
      typeof stream?.joinFee === "number" && Number.isFinite(stream.joinFee)
        ? stream.joinFee
        : null;

    if (joinFee === null) return;
    if (joinFee <= 0) {
      setJoinedLive(stream);
      setLiveComments([]);
      setSentGifts([]);
    } else {
      setShowJoinConfirm({ ...stream, joinFee });
    }
  };

  const confirmPaidJoin = () => {
    if (!showJoinConfirm) return;
    const joinFee =
      typeof showJoinConfirm.joinFee === "number" &&
      Number.isFinite(showJoinConfirm.joinFee)
        ? showJoinConfirm.joinFee
        : null;
    if (joinFee === null) return;
    if (walletBalance >= joinFee) {
      setWalletBalance((prev) => prev - joinFee);
      setJoinedLive(showJoinConfirm);
      setShowJoinConfirm(null);
      setLiveComments([]);
      setSentGifts([]);
    }
  };

  const sendGift = (gift: (typeof liveGifts)[0]) => {
    if (walletBalance >= gift.price) {
      setWalletBalance((prev) => prev - gift.price);
      setSentGifts((prev) => [...prev, { name: gift.name, icon: gift.icon }]);
      setLiveComments((prev) => [
        ...prev,
        {
          user: "You",
          text: `sent ${gift.icon} ${gift.name}`,
          gift: gift.icon,
        },
      ]);
      setShowGiftShop(false);
    }
  };

  const sendLiveComment = () => {
    if (liveComment.trim()) {
      setLiveComments((prev) => [...prev, { user: "You", text: liveComment }]);
      setLiveComment("");
    }
  };

  if (isInitialLoading) {
    return <CustomerHomeSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-5">
        {/* Greeting Section */}
        <div className="mb-5">
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">
            Welcome back, {user?.name?.split(" ")[0] || "Guest"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Discover what{"'"}s happening in your neighborhood
          </p>
        </div>

        {/* AI-Assisted Search Bar */}
        <AISearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Desktop: 2-column top area for Quick Fix + Emergency. Mobile: stacked */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-4 lg:mb-6">
          <QuickFixCard />
          <EmergencyBanner emergency={emergencyAlertData} />
        </div>

        {/* Live Now Avatars Row */}
        {liveProvidersData.length > 0 && (
          <LiveNowAvatars
            onJoinLive={handleJoinLive}
            providers={liveProvidersData}
          />
        )}

        {/* Featured Shops */}
        <FeaturedShopsSection shops={featuredShopsData} />

        {/* Category Filter Tabs */}
        {/* Service Categories Grid */}
        <ServiceCategoriesGrid categories={serviceCategoriesData} />

        {/* Desktop 2-column layout for stories + workshops */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-6">
          {/* Project Stories Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Project Stories
              </h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
              {projectStoriesData.map((story, index) => (
                <button
                  key={story.id}
                  onClick={() => {
                    setActiveStoryIndex(index);
                    setShowStoryViewer(true);
                  }}
                  className="flex-shrink-0 w-24"
                >
                  <div className="relative w-24 h-32 rounded-xl overflow-hidden ring-2 ring-primary ring-offset-2 ring-offset-background mb-1.5">
                    <Image
                      src={
                        story.type === "before-after"
                          ? story.afterImage || "/placeholder.svg"
                          : story.thumbnail || "/placeholder.svg"
                      }
                      alt={story.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-1.5 left-1.5 right-1.5">
                      <p className="text-white text-[10px] font-medium truncate">
                        {story.title}
                      </p>
                    </div>
                    {story.type === "timelapse" && (
                      <div className="absolute top-1.5 right-1.5 bg-black/50 rounded-full p-0.5">
                        <Play className="w-2.5 h-2.5 text-white fill-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full overflow-hidden ring-2 ring-primary">
                      <Image
                        src={story.avatar || "/placeholder.svg"}
                        alt=""
                        width={20}
                        height={20}
                        className="object-cover"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {story.specialist}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Live Workshops */}
          {liveExpertsData.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Radio className="w-5 h-5 text-red-500 animate-pulse" />
                  Live Workshops
                </h2>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide lg:flex-col lg:overflow-x-visible">
                {liveExpertsData.map((stream) => {
                const joinFee =
                  typeof stream?.joinFee === "number" &&
                  Number.isFinite(stream.joinFee)
                    ? stream.joinFee
                    : null;
                const isFree = joinFee !== null && joinFee <= 0;
                return (
                <Card
                  key={stream.id}
                  className="flex-shrink-0 w-64 lg:w-full overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="lg:flex">
                    <div className="relative h-32 lg:h-auto lg:w-40 flex-shrink-0">
                      <Image
                        src={stream.thumbnail || "/placeholder.svg"}
                        alt={stream.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent lg:bg-gradient-to-r" />
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                          <span className="w-1 h-1 bg-white rounded-full animate-pulse" />
                          LIVE
                        </span>
                        <span className="px-1.5 py-0.5 bg-black/50 text-white text-[10px] rounded-full flex items-center gap-1">
                          <Eye className="w-2.5 h-2.5" /> {stream.viewers}
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 lg:hidden">
                        <p className="text-white font-semibold text-xs mb-0.5 truncate">
                          {stream.title}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <Image
                            src={stream.hostAvatar || "/placeholder.svg"}
                            alt=""
                            width={18}
                            height={18}
                            className="rounded-full"
                          />
                          <span className="text-white/80 text-[10px]">
                            {stream.host}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-2.5 lg:p-3 lg:flex-1 flex flex-col justify-between">
                      <div className="hidden lg:block mb-2">
                        <p className="font-semibold text-foreground text-sm mb-0.5">
                          {stream.title}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <Image
                            src={stream.hostAvatar || "/placeholder.svg"}
                            alt=""
                            width={18}
                            height={18}
                            className="rounded-full"
                          />
                          <span className="text-muted-foreground text-xs">
                            {stream.host} - {stream.specialty}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleJoinLive(stream)}
                        size="sm"
                        disabled={joinFee === null}
                        className={`w-full h-8 text-xs rounded-lg ${isFree ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-primary hover:bg-primary/90 text-primary-foreground"}`}
                      >
                        {joinFee === null
                          ? "Unavailable"
                          : isFree
                            ? "Join Free"
                            : `Join - ${formatCurrency(joinFee)}`}
                      </Button>
                    </div>
                  </div>
                </Card>
                )})}
              </div>
            </div>
          )}
        </div>

        {/* Find Specialists CTA */}
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20 p-5 lg:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <h3 className="text-lg lg:text-xl font-bold text-foreground mb-1">
                Need a Specialist?
              </h3>
              <p className="text-sm text-muted-foreground">
                Find verified professionals near you with great reviews
              </p>
            </div>
            <Link href="/customer/find-specialists">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
                Find Specialists <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Story Viewer Modal */}
      <Dialog open={showStoryViewer} onOpenChange={setShowStoryViewer}>
        <DialogContent className="max-w-md p-0 bg-black overflow-hidden h-[90vh] max-h-[700px]">
          <div className="relative h-full">
            {projectStoriesData[activeStoryIndex] && (
              <>
                <Image
                  src={
                    projectStoriesData[activeStoryIndex].type === "before-after"
                      ? projectStoriesData[activeStoryIndex].afterImage ||
                        "/placeholder.svg"
                      : projectStoriesData[activeStoryIndex].thumbnail ||
                        "/placeholder.svg"
                  }
                  alt=""
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                <div className="absolute top-4 left-4 right-4 flex gap-1">
                  {projectStoriesData.map((_, idx) => (
                    <div
                      key={idx}
                      className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
                    >
                      <div
                        className={`h-full bg-white transition-all duration-300 ${idx < activeStoryIndex ? "w-full" : idx === activeStoryIndex ? "w-1/2" : "w-0"}`}
                      />
                    </div>
                  ))}
                </div>
                <div className="absolute top-8 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white">
                      <Image
                        src={
                          projectStoriesData[activeStoryIndex].avatar ||
                          "/placeholder.svg"
                        }
                        alt=""
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {projectStoriesData[activeStoryIndex].specialist}
                      </p>
                      <p className="text-white/70 text-xs">
                        {projectStoriesData[activeStoryIndex].timestamp}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowStoryViewer(false)}
                    className="p-2 hover:bg-white/20 rounded-full"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
                <button
                  onClick={() =>
                    setActiveStoryIndex((prev) => Math.max(0, prev - 1))
                  }
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1/3 h-1/2"
                  aria-label="Previous story"
                />
                <button
                  onClick={() =>
                    setActiveStoryIndex((prev) =>
                      Math.min(projectStoriesData.length - 1, prev + 1),
                    )
                  }
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-1/2"
                  aria-label="Next story"
                />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white font-semibold mb-2">
                    {projectStoriesData[activeStoryIndex].title}
                  </p>
                  <div className="flex items-center gap-4 text-white/70 text-sm">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />{" "}
                      {projectStoriesData[activeStoryIndex].views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />{" "}
                      {projectStoriesData[activeStoryIndex].duration}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Paid Join Confirmation Modal */}
      <Dialog
        open={!!showJoinConfirm}
        onOpenChange={() => setShowJoinConfirm(null)}
      >
        <DialogContent className="max-w-sm">
          {showJoinConfirm && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-primary mx-auto mb-3">
                <Image
                  src={showJoinConfirm.hostAvatar || "/placeholder.svg"}
                  alt=""
                  width={64}
                  height={64}
                  className="object-cover"
                />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">
                {showJoinConfirm.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-1">
                Hosted by {showJoinConfirm.host}
              </p>
              <div className="bg-muted/50 rounded-xl p-4 my-4">
                <p className="text-xs text-muted-foreground mb-1">Entry Fee</p>
                <p className="text-2xl font-bold text-foreground">
                  {typeof showJoinConfirm.joinFee === "number"
                    ? formatCurrency(showJoinConfirm.joinFee)
                    : ""}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Wallet Balance:{" "}
                  <span
                    className={`font-semibold ${walletBalance >= (typeof showJoinConfirm.joinFee === "number" ? showJoinConfirm.joinFee : Number.POSITIVE_INFINITY) ? "text-emerald-600" : "text-red-500"}`}
                  >
                    {formatCurrency(walletBalance)}
                  </span>
                </p>
              </div>
              {typeof showJoinConfirm.joinFee === "number" &&
              walletBalance >= showJoinConfirm.joinFee ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowJoinConfirm(null)}
                    className="flex-1 bg-transparent rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmPaidJoin}
                    className="flex-1 rounded-xl"
                  >
                    Pay & Join
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-red-500 mb-3">
                    Insufficient wallet balance
                  </p>
                  <Link href="/customer/wallet">
                    <Button className="w-full rounded-xl">Top Up Wallet</Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Live Stream Viewer Modal */}
      <Dialog
        open={!!joinedLive}
        onOpenChange={() => {
          setJoinedLive(null);
          setShowGiftShop(false);
        }}
      >
        <DialogContent className="max-w-lg p-0 bg-black overflow-hidden h-[90vh] max-h-[800px]">
          {joinedLive && (
            <div className="relative h-full flex flex-col">
              {/* Video Background */}
              <div className="absolute inset-0">
                <Image
                  src={joinedLive.thumbnail || "/placeholder.svg"}
                  alt=""
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60" />
              </div>

              {/* Top Bar */}
              <div className="relative z-10 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-red-500">
                    <Image
                      src={joinedLive.hostAvatar || "/placeholder.svg"}
                      alt=""
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {joinedLive.host}
                    </p>
                    <p className="text-white/60 text-xs">
                      {joinedLive.specialty}
                    </p>
                  </div>
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />{" "}
                    LIVE
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/80 text-xs flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-full">
                    <Eye className="w-3.5 h-3.5" /> {joinedLive.viewers}
                  </span>
                  <button
                    onClick={() => {
                      setJoinedLive(null);
                      setShowGiftShop(false);
                    }}
                    className="p-2 bg-black/40 rounded-full hover:bg-black/60 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Wallet Badge */}
              <div className="relative z-10 px-4">
                <span className="inline-flex items-center gap-1.5 text-xs bg-black/40 text-white/80 px-3 py-1.5 rounded-full">
                  Wallet:{" "}
                  <span className="font-semibold text-emerald-400">
                    {formatCurrency(walletBalance)}
                  </span>
                </span>
              </div>

              {/* Floating Gift Animations */}
              {sentGifts.length > 0 && (
                <div className="absolute right-4 bottom-48 z-20 flex flex-col items-center gap-1">
                  {sentGifts.slice(-3).map((g, idx) => (
                    <span
                      key={idx}
                      className="text-3xl animate-bounce"
                      style={{ animationDelay: `${idx * 150}ms` }}
                    >
                      {g.icon}
                    </span>
                  ))}
                </div>
              )}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Comments Feed */}
              <div className="relative z-10 px-4 max-h-44 overflow-y-auto mb-2 scrollbar-hide">
                {liveComments.map((comment, idx) => (
                  <div
                    key={idx}
                    className={`mb-1.5 px-3 py-1.5 rounded-lg ${comment.gift ? "bg-amber-500/30" : "bg-black/40"}`}
                  >
                    <span
                      className={`font-semibold text-sm ${comment.user === "System" ? "text-emerald-400" : comment.user === "You" ? "text-blue-400" : "text-white"}`}
                    >
                      {comment.user}
                    </span>
                    <span className="text-white/80 text-sm">
                      {" "}
                      {comment.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Gift Shop Overlay */}
              {showGiftShop && (
                <div className="relative z-20 mx-4 mb-2 bg-black/80 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-white font-semibold text-sm">
                      Send a Gift
                    </p>
                    <button
                      onClick={() => setShowGiftShop(false)}
                      className="text-white/60 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {liveGifts.map((gift) => (
                      <button
                        key={gift.id}
                        onClick={() => sendGift(gift)}
                        disabled={walletBalance < gift.price}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all ${
                          walletBalance >= gift.price
                            ? "bg-white/10 hover:bg-white/20 hover:scale-105"
                            : "bg-white/5 opacity-40 cursor-not-allowed"
                        }`}
                      >
                        <span className="text-2xl">{gift.icon}</span>
                        <span className="text-white text-[10px] font-medium">
                          {gift.name}
                        </span>
                        <span className="text-amber-400 text-[10px] font-bold">
                          {formatCurrency(gift.price)}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-white/50 text-[10px] mt-2">
                    Gifts are charged from your wallet balance
                  </p>
                </div>
              )}

              {/* Bottom Input Bar */}
              <div className="relative z-10 p-4 flex gap-2">
                <Input
                  value={liveComment}
                  onChange={(e) => setLiveComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendLiveComment()}
                  placeholder="Say something..."
                  className="flex-1 bg-white/15 border-0 text-white placeholder:text-white/40 rounded-full h-10 text-sm"
                />
                <Button
                  onClick={sendLiveComment}
                  size="icon"
                  className="bg-primary rounded-full h-10 w-10 flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setShowGiftShop(!showGiftShop)}
                  size="icon"
                  className={`rounded-full h-10 w-10 flex-shrink-0 transition-all ${showGiftShop ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-white/15 hover:bg-white/25 text-amber-400 border-0"}`}
                >
                  <Gift className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
