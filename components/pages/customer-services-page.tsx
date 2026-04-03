"use client";

import { useCallback, useState, useEffect } from "react";
import { useAuthContext } from "@/lib/auth-context";
import { useLocalization } from "@/lib/hooks/useLocalization";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Search,
  Star,
  MapPin,
  Clock,
  CheckCircle,
  Heart,
  Navigation,
  Grid3X3,
  List,
  TrendingUp,
  ShoppingBag,
  Zap,
  CalendarIcon,
  Phone,
  MessageCircle,
  Loader2,
  SlidersHorizontal,
  ChevronRight,
  Eye,
  AlertTriangle,
  Wallet,
  ShieldCheck,
  ArrowRight,
  Check,
  Info,
  Wrench,
  Droplets,
  Flame,
  CloudRain,
  Key,
  PanelTop,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";

const EMERGENCY_FEE = 2000;
const DOWNPAYMENT_PERCENT = 0.25;

const serviceIconMap: Record<string, any> = {
  plumbing: Droplets,
  electrical: Zap,
  cleaning: ShoppingBag,
  painting: PanelTop,
  carpentry: Wrench,
  "ac-repair": Flame,
  hvac: Flame,
  landscaping: CloudRain,
  garden: CloudRain,
  locksmith: Key,
};

const emergencyIconMap: Record<string, any> = {
  burst: Droplets,
  pipe: Droplets,
  water: Droplets,
  electrical: Zap,
  outage: Zap,
  gas: Flame,
  fire: Flame,
  flood: CloudRain,
  lock: Key,
  window: PanelTop,
};

export function CustomerServicesPage() {
  const { currency } = useLocalization();
  const { user, isAuthenticated, isLoading, logout } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedService, setSelectedService] = useState<any>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [bookingDate, setBookingDate] = useState<Date | undefined>(undefined);
  const [bookingTime, setBookingTime] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingStep, setBookingStep] = useState(1);
  const [priceRange, setPriceRange] = useState("all");
  const [rating, setRating] = useState("all");
  const [availability, setAvailability] = useState("all");

  // Emergency booking state
  const [showEmergencyWizard, setShowEmergencyWizard] = useState(false);
  const [emergencyStep, setEmergencyStep] = useState(1);
  const [emergencyCategory, setEmergencyCategory] = useState("");
  const [emergencyDescription, setEmergencyDescription] = useState("");
  const [emergencyLocation, setEmergencyLocation] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [emergencyBooked, setEmergencyBooked] = useState(false);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [serviceCategories, setServiceCategories] = useState<any[]>([]);
  const [emergencyCategories, setEmergencyCategories] = useState<any[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  const handleUnauthorized = useCallback(async () => {
    await logout();
  }, [logout]);

  const categories = [
    { id: "all", name: "All Services", icon: Grid3X3 },
    ...serviceCategories,
  ];

  const trendingProducts = allServices.slice(0, 4).map((service, index) => ({
    id: String(service.id || index + 1),
    name: String(service.title || "Service"),
    price: Number(service.price || 0),
    shop: String(service.provider || "Provider"),
    image: String(service.image || "/placeholder.svg"),
    discount: 0,
  }));

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

  const detectLocation = useCallback(() => {
    if (isLoading || !isAuthenticated || !user?.id) {
      setCurrentLocation(null);
      return;
    }

    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const latitude = Number(position.coords.latitude.toFixed(6));
          const longitude = Number(position.coords.longitude.toFixed(6));
          const accuracy = Number(position.coords.accuracy.toFixed(0));
          const label = `${latitude}, ${longitude}`;

          setCurrentLocation(label);

          const response = await fetch("/api/auth/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: label,
              latitude,
              longitude,
              accuracy,
            }),
          }).catch(() => {
            // Keep page usable if location sync fails.
            return null;
          });

          if (response?.status === 401) {
            setIsLocating(false);
            await handleUnauthorized();
            return;
          }

          setIsLocating(false);
        },
        () => {
          setCurrentLocation((previous) => previous);
          setIsLocating(false);
        },
      );
    } else {
      setCurrentLocation((previous) => previous);
      setIsLocating(false);
    }
  }, [handleUnauthorized, isAuthenticated, isLoading, user?.id]);

  const loadSavedLocation = useCallback(async () => {
    if (isLoading || !isAuthenticated || !user?.id) {
      return;
    }

    try {
      const response = await fetch("/api/auth/location", { cache: "no-store" });
      if (response.status === 401) {
        await handleUnauthorized();
        return;
      }

      const payload = await response.json();
      const location = String(payload?.data?.location || "").trim();
      if (location) {
        setCurrentLocation(location);
      }
    } catch {
      // Keep existing location when saved location lookup fails.
    }
  }, [handleUnauthorized, isAuthenticated, isLoading, user?.id]);

  useEffect(() => {
    loadSavedLocation();
  }, [loadSavedLocation]);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user?.id) {
      setAllServices([]);
      setServiceCategories([]);
      setEmergencyCategories([]);
      setWalletBalance(0);
      setIsLoadingServices(false);
      return;
    }

    let active = true;

    const loadMarketplace = async () => {
      try {
        setIsLoadingServices(true);
        const [servicesRes, walletRes, emergencyRes] = await Promise.all([
          fetch("/api/services", { cache: "no-store" }),
          fetch("/api/wallet", { cache: "no-store" }),
          fetch("/api/services/emergency", { cache: "no-store" }),
        ]);

        if (servicesRes.status === 401 || walletRes.status === 401 || emergencyRes.status === 401) {
          await handleUnauthorized();
          return;
        }

        const servicesPayload = await servicesRes.json();
        const walletPayload = await walletRes.json();
        const emergencyPayload = await emergencyRes.json();

        if (!active) return;

        const serviceRows = Array.isArray(servicesPayload?.data)
          ? servicesPayload.data
          : [];
        setAllServices(
          serviceRows.map((row: any) => ({
            id: String(row.id),
            title: String(row.name || "Service"),
            provider: String(row?.provider?.name || "Provider"),
            category: String(row.category || "general").toLowerCase(),
            rating: 5,
            reviews: 0,
            price: Number(row.basePrice || 0),
            image: String(row.image || "/placeholder.svg"),
            avatar: String(row?.provider?.image || "/placeholder.svg"),
            location: "Kenya",
            distance: "-",
            responseTime: "Live",
            available: true,
            verified: true,
            badges: [],
          })),
        );

        const dynamicCategories = Array.from(
          new Set(
            serviceRows
              .map((row: any) => String(row.category || "").trim().toLowerCase())
              .filter(Boolean),
          ),
        ).map((category) => ({
          id: category,
          name: category
            .split(/[-_\s]+/)
            .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
            .join(" "),
          icon: serviceIconMap[category] || BriefcaseBusiness,
        }));

        setServiceCategories(dynamicCategories);

        const emergencies = Array.isArray(emergencyPayload?.data)
          ? emergencyPayload.data
          : [];

        setEmergencyCategories(
          emergencies.map((row: any) => {
            const text = [row.label, row.description, row.id]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();
            const iconEntry = Object.entries(emergencyIconMap).find(([key]) =>
              text.includes(key),
            );
            return {
              id: String(row.id),
              label: String(row.label || "Emergency Service"),
              price: Number(row.price || 0),
              description: String(row.description || "Urgent service"),
              icon: iconEntry ? iconEntry[1] : AlertTriangle,
            };
          }),
        );

        if (walletRes.ok && walletPayload?.ok) {
          setWalletBalance(Number(walletPayload?.data?.balance || 0));
        }
      } catch {
        if (!active) return;
        setAllServices([]);
        setServiceCategories([]);
        setEmergencyCategories([]);
      } finally {
        if (active) setIsLoadingServices(false);
      }
    };

    loadMarketplace();
    return () => {
      active = false;
    };
  }, [handleUnauthorized, isAuthenticated, isLoading, user?.id]);

  const filteredServices = allServices.filter((service) => {
    const matchesSearch =
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.provider.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFavorite = (id: string | number) => {
    const normalizedId = String(id);
    setFavorites((prev) =>
      prev.includes(normalizedId)
        ? prev.filter((fav) => fav !== normalizedId)
        : [...prev, normalizedId],
    );
  };

  const openBooking = (service: any) => {
    setSelectedService(service);
    setShowBookingModal(true);
    setBookingStep(1);
  };

  const getBookingTotal = () => selectedService?.price || 0;
  const getDownpayment = () =>
    Math.ceil(getBookingTotal() * DOWNPAYMENT_PERCENT);
  const hasEnoughBalance = () => walletBalance >= getDownpayment();

  const handleBookingSubmit = () => {
    if (bookingStep < 3) {
      setBookingStep(bookingStep + 1);
    } else {
      const dp = getDownpayment();
      if (walletBalance < dp) return;
      setWalletBalance((prev) => prev - dp);
      alert(
        `Booking confirmed! KES ${dp.toLocaleString()} (25% downpayment) deducted from your wallet.`,
      );
      setShowBookingModal(false);
      setBookingStep(1);
      setBookingDate(undefined);
      setBookingTime("");
      setBookingNotes("");
    }
  };

  const getSelectedEmergency = () =>
    emergencyCategories.find((c) => c.id === emergencyCategory);
  const getEmergencyTotal = () =>
    (getSelectedEmergency()?.price || 0) + EMERGENCY_FEE;
  const getEmergencyDownpayment = () =>
    Math.ceil(getEmergencyTotal() * DOWNPAYMENT_PERCENT);
  const hasEnoughForEmergency = () =>
    walletBalance >= getEmergencyDownpayment();
  const displayLocation = currentLocation || "Anywhere";

  const handleEmergencySubmit = () => {
    const dp = getEmergencyDownpayment();
    if (walletBalance < dp) return;
    setWalletBalance((prev) => prev - dp);
    setEmergencyBooked(true);
  };

  const resetEmergencyWizard = () => {
    setShowEmergencyWizard(false);
    setEmergencyStep(1);
    setEmergencyCategory("");
    setEmergencyDescription("");
    setEmergencyLocation("");
    setEmergencyBooked(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight text-balance">
                Marketplace
              </h1>
              <div className="flex items-center gap-2 mt-1.5 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                {isLocating ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Detecting...
                  </span>
                ) : (
                  <span>{displayLocation}</span>
                )}
                <button
                  onClick={detectLocation}
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full">
                <Wallet className="w-3.5 h-3.5" />
                <span className="font-semibold">
                  KES {walletBalance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Service Banner */}
        <Card className="mb-6 overflow-hidden border-0 shadow-md bg-gradient-to-r from-red-600 to-orange-500 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 lg:p-5">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base">Emergency Service</h3>
                <p className="text-sm text-white/80">
                  Need urgent help? Book a priority provider now. +KES 2,000
                  surcharge
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                setShowEmergencyWizard(true);
                setEmergencyStep(1);
                setEmergencyBooked(false);
              }}
              className="bg-white text-red-600 hover:bg-white/90 font-semibold rounded-xl h-10 px-6 w-full sm:w-auto flex-shrink-0 shadow-lg"
            >
              <Zap className="w-4 h-4 mr-2" />
              Book Emergency
            </Button>
          </div>
        </Card>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services, providers..."
              className="pl-10 h-11 rounded-xl bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(true)}
              className="h-11 px-5 rounded-xl gap-2 bg-transparent border-border"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
            <div className="flex items-center gap-0.5 bg-muted/50 rounded-xl p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Categories - Scrollable */}
        <div className="mb-8 -mx-4 px-4 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all text-sm font-medium ${
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Trending Products */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-primary" />
              </div>
              Trending Products
            </h2>
            <Link
              href="/services"
              className="text-sm text-primary font-medium flex items-center gap-0.5 hover:gap-1.5 transition-all"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {trendingProducts.map((product) => (
              <Card
                key={product.id}
                className="flex-shrink-0 w-40 sm:w-44 overflow-hidden border-0 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="relative aspect-square bg-muted/30">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.discount > 0 && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-red-500 text-white text-[11px] font-bold rounded-md">
                      -{product.discount}%
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm text-foreground truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {product.shop}
                  </p>
                  <p className="text-primary font-bold text-sm mt-1.5">
                    KES {product.price.toLocaleString()}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Popular Services */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              Popular Services
            </h2>
            <p className="text-sm text-muted-foreground">
              {isLoadingServices
                ? "Loading..."
                : `${filteredServices.length} found`}
            </p>
          </div>

          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-3"
            }
          >
            {filteredServices.map((service) => (
              <Card
                key={service.id}
                className={`overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all group ${viewMode === "list" ? "flex flex-row" : ""}`}
              >
                <div
                  className={`relative ${viewMode === "list" ? "w-28 sm:w-36 flex-shrink-0" : "aspect-[16/10]"}`}
                >
                  <Image
                    src={service.image || "/placeholder.svg"}
                    alt={service.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <button
                    onClick={() => toggleFavorite(service.id)}
                    className="absolute top-2.5 right-2.5 p-1.5 bg-white/90 dark:bg-black/50 rounded-full shadow-sm backdrop-blur-sm hover:scale-110 transition-transform"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${favorites.includes(String(service.id)) ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
                    />
                  </button>
                  <span
                    className={`absolute bottom-2.5 left-2.5 px-2 py-0.5 text-[11px] font-semibold rounded-md backdrop-blur-sm ${
                      service.available
                        ? "bg-emerald-500/90 text-white"
                        : "bg-muted-foreground/80 text-white"
                    }`}
                  >
                    {service.available ? "Available" : "Busy"}
                  </span>
                </div>

                <div
                  className={`p-4 ${viewMode === "list" ? "flex-1 flex flex-col justify-between" : ""}`}
                >
                  <div>
                    <div className="flex items-start gap-2.5 mb-2.5">
                      <div className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-background">
                        <Image
                          src={service.avatar || "/placeholder.svg"}
                          alt={service.provider}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-sm text-foreground truncate">
                            {service.provider}
                          </p>
                          {service.verified && (
                            <CheckCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {service.title}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mb-2.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-foreground">
                          {service.rating}
                        </span>
                        <span>({service.reviews})</span>
                      </div>
                      <span className="w-px h-3 bg-border" />
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {service.distance}
                      </div>
                      <span className="w-px h-3 bg-border" />
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {service.responseTime}
                      </div>
                    </div>

                    {service.badges.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {service.badges.map((badge, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-primary/8 text-primary text-[11px] font-medium rounded-md"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <div>
                      <p className="text-[11px] text-muted-foreground">From</p>
                      <p className="text-base font-bold text-foreground">
                        KES {service.price.toLocaleString()}
                        <span className="text-xs font-normal text-muted-foreground">
                          /hr
                        </span>
                      </p>
                    </div>
                    <Button
                      onClick={() => openBooking(service)}
                      disabled={!service.available}
                      size="sm"
                      className="rounded-lg h-9 px-4 text-sm font-medium"
                    >
                      Book Now
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredServices.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold text-foreground mb-1">
                No services found
              </p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Filters Modal */}
      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Filter Services</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Price Range
              </label>
              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="0-2000">Under KES 2,000</SelectItem>
                  <SelectItem value="2000-5000">KES 2,000 - 5,000</SelectItem>
                  <SelectItem value="5000+">Above KES 5,000</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Minimum Rating
              </label>
              <Select value={rating} onValueChange={setRating}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Rating</SelectItem>
                  <SelectItem value="4.5">4.5+ Stars</SelectItem>
                  <SelectItem value="4.0">4.0+ Stars</SelectItem>
                  <SelectItem value="3.5">3.5+ Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Availability
              </label>
              <Select value={availability} onValueChange={setAvailability}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="available">Available Now</SelectItem>
                  <SelectItem value="today">Available Today</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-xl bg-transparent"
              onClick={() => {
                setPriceRange("all");
                setRating("all");
                setAvailability("all");
              }}
            >
              Reset
            </Button>
            <Button
              className="flex-1 rounded-xl"
              onClick={() => setShowFilters(false)}
            >
              Apply Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl">
          {selectedService && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg">
                  {bookingStep === 1 && "Select Date & Time"}
                  {bookingStep === 2 && "Service Details"}
                  {bookingStep === 3 && "Confirm & Pay"}
                </DialogTitle>
              </DialogHeader>

              {/* Progress */}
              <div className="flex items-center gap-2 mb-5">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                        bookingStep >= step
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step}
                    </div>
                    {step < 3 && (
                      <div
                        className={`flex-1 h-0.5 mx-2 rounded transition-colors ${bookingStep > step ? "bg-primary" : "bg-muted"}`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Service Preview */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 mb-4">
                <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-background">
                  <Image
                    src={selectedService.avatar || "/placeholder.svg"}
                    alt=""
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {selectedService.provider}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedService.title}
                  </p>
                </div>
                <p className="font-bold text-sm text-primary">
                  KES {selectedService.price}/hr
                </p>
              </div>

              {bookingStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Date
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal bg-transparent rounded-xl h-11"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                          {bookingDate
                            ? format(bookingDate, "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={bookingDate}
                          onSelect={setBookingDate}
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Time
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => setBookingTime(time)}
                          className={`p-2 text-xs font-medium rounded-lg border transition-all ${
                            bookingTime === time
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {bookingStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Location
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Enter your address"
                        defaultValue={currentLocation || ""}
                        className="flex-1 rounded-xl"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={detectLocation}
                        className="bg-transparent rounded-xl"
                      >
                        <Navigation className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Notes
                    </label>
                    <Textarea
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      placeholder="Describe the issue or special requirements..."
                      className="min-h-[80px] rounded-xl"
                    />
                  </div>
                </div>
              )}

              {bookingStep === 3 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-muted/50 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span className="text-foreground font-medium">
                        {bookingDate ? format(bookingDate, "PPP") : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time</span>
                      <span className="text-foreground font-medium">
                        {bookingTime || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location</span>
                      <span className="text-foreground font-medium">
                        {displayLocation}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-primary/20 space-y-3">
                    <h4 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                      <Wallet className="w-4 h-4 text-primary" />
                      Payment Breakdown
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Service Price
                        </span>
                        <span className="font-medium">
                          KES {getBookingTotal().toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-border pt-2 mt-2">
                        <span className="font-semibold">Downpayment (25%)</span>
                        <span className="text-primary font-bold text-base">
                          KES {getDownpayment().toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          Due on completion
                        </span>
                        <span className="text-muted-foreground">
                          KES{" "}
                          {(
                            getBookingTotal() - getDownpayment()
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`p-2.5 rounded-lg flex items-center gap-2 text-sm ${hasEnoughBalance() ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"}`}
                    >
                      <Wallet className="w-4 h-4 flex-shrink-0" />
                      <span>
                        Wallet:{" "}
                        <strong>KES {walletBalance.toLocaleString()}</strong>
                      </span>
                      {hasEnoughBalance() ? (
                        <CheckCircle className="w-4 h-4 ml-auto" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 ml-auto" />
                      )}
                    </div>
                    {!hasEnoughBalance() && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        Insufficient balance.{" "}
                        <Link
                          href="/customer/wallet"
                          className="underline font-medium"
                        >
                          Top up wallet
                        </Link>
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-5">
                {bookingStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={() => setBookingStep(bookingStep - 1)}
                    className="flex-1 rounded-xl bg-transparent"
                  >
                    Back
                  </Button>
                )}
                <Button
                  onClick={handleBookingSubmit}
                  disabled={
                    (bookingStep === 1 && (!bookingDate || !bookingTime)) ||
                    (bookingStep === 3 && !hasEnoughBalance())
                  }
                  className="flex-1 rounded-xl"
                >
                  {bookingStep === 3
                    ? `Pay KES ${getDownpayment().toLocaleString()}`
                    : "Continue"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Emergency Booking Wizard */}
      <Dialog
        open={showEmergencyWizard}
        onOpenChange={(open) => {
          if (!open) resetEmergencyWizard();
        }}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl">
          {!emergencyBooked ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  {emergencyStep === 1 && "Select Emergency Type"}
                  {emergencyStep === 2 && "Emergency Details"}
                  {emergencyStep === 3 && "Confirm & Pay"}
                </DialogTitle>
              </DialogHeader>

              <div className="flex items-center gap-2 mb-4">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${emergencyStep >= step ? "bg-red-600 text-white" : "bg-muted text-muted-foreground"}`}
                    >
                      {step}
                    </div>
                    {step < 3 && (
                      <div
                        className={`flex-1 h-0.5 mx-2 rounded ${emergencyStep > step ? "bg-red-600" : "bg-muted"}`}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 mb-4">
                <Info className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
                  Emergency services include a <strong>KES 2,000</strong>{" "}
                  surcharge. A <strong>25% downpayment</strong> is required from
                  your wallet.
                </p>
              </div>

              {emergencyStep === 1 && (
                <div className="grid grid-cols-2 gap-3">
                  {emergencyCategories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setEmergencyCategory(cat.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${emergencyCategory === cat.id ? "border-red-500 bg-red-50 dark:bg-red-950/20 shadow-sm" : "border-border hover:border-red-300 dark:hover:border-red-700"}`}
                      >
                        <Icon
                          className={`w-5 h-5 mb-2 ${emergencyCategory === cat.id ? "text-red-600" : "text-muted-foreground"}`}
                        />
                        <p className="font-semibold text-foreground text-sm">
                          {cat.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          KES {cat.price.toLocaleString()}{" "}
                          <span className="text-red-500">+ 2,000</span>
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}

              {emergencyStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Describe the Emergency
                    </label>
                    <Textarea
                      value={emergencyDescription}
                      onChange={(e) => setEmergencyDescription(e.target.value)}
                      placeholder="What happened? Any urgent details..."
                      className="min-h-[80px] rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Your Location
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={emergencyLocation}
                        onChange={(e) => setEmergencyLocation(e.target.value)}
                        placeholder="Enter your address"
                        className="flex-1 rounded-xl"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="bg-transparent rounded-xl"
                        onClick={() => {
                          detectLocation();
                          setEmergencyLocation(displayLocation === "Anywhere" ? "" : displayLocation);
                        }}
                      >
                        <Navigation className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {emergencyStep === 3 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-muted/50 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium">
                        {getSelectedEmergency()?.label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium truncate ml-4">
                        {emergencyLocation || displayLocation}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border-2 border-red-200 dark:border-red-900/30 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Service Cost
                      </span>
                      <span className="font-medium">
                        KES{" "}
                        {(getSelectedEmergency()?.price || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-red-600 dark:text-red-400">
                      <span>Emergency Surcharge</span>
                      <span className="font-medium">
                        + KES {EMERGENCY_FEE.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold">
                        KES {getEmergencyTotal().toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2">
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        Downpayment (25%)
                      </span>
                      <span className="text-red-600 dark:text-red-400 font-bold text-base">
                        KES {getEmergencyDownpayment().toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`p-2.5 rounded-lg flex items-center gap-2 text-sm ${hasEnoughForEmergency() ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"}`}
                  >
                    <Wallet className="w-4 h-4 flex-shrink-0" />
                    <span>
                      Wallet:{" "}
                      <strong>KES {walletBalance.toLocaleString()}</strong>
                    </span>
                    {hasEnoughForEmergency() ? (
                      <CheckCircle className="w-4 h-4 ml-auto" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 ml-auto" />
                    )}
                  </div>
                  {!hasEnoughForEmergency() && (
                    <p className="text-xs text-red-600">
                      Insufficient balance.{" "}
                      <Link
                        href="/customer/wallet"
                        className="underline font-medium"
                      >
                        Top up wallet
                      </Link>
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3 mt-5">
                {emergencyStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={() => setEmergencyStep(emergencyStep - 1)}
                    className="flex-1 rounded-xl bg-transparent"
                  >
                    Back
                  </Button>
                )}
                <Button
                  onClick={() =>
                    emergencyStep < 3
                      ? setEmergencyStep(emergencyStep + 1)
                      : handleEmergencySubmit()
                  }
                  disabled={
                    (emergencyStep === 1 && !emergencyCategory) ||
                    (emergencyStep === 2 &&
                      (!emergencyDescription || !emergencyLocation)) ||
                    (emergencyStep === 3 && !hasEnoughForEmergency())
                  }
                  className={`flex-1 rounded-xl ${emergencyStep === 3 ? "bg-red-600 hover:bg-red-700" : ""}`}
                >
                  {emergencyStep === 3
                    ? `Pay KES ${getEmergencyDownpayment().toLocaleString()}`
                    : "Continue"}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Emergency Booked
              </h3>
              <p className="text-muted-foreground mb-1 text-sm">
                A provider is being dispatched to your location.
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                KES {getEmergencyDownpayment().toLocaleString()} has been
                deducted from your wallet.
              </p>
              <Button onClick={resetEmergencyWizard} className="rounded-xl">
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
