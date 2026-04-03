"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuthContext } from "@/lib/auth-context";
import { useLocalization } from "@/lib/hooks/useLocalization";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Calendar, Clock, MapPin, Check } from "lucide-react";

export default function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currency } = useLocalization();
  const { user, isAuthenticated, isLoading, logout } = useAuthContext();

  const handleUnauthorized = useCallback(async () => {
    await logout();
  }, [logout]);

  const providerId = searchParams.get("provider");
  const serviceId = searchParams.get("service");
  const bookingType = searchParams.get("type");

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingService, setIsLoadingService] = useState(true);
  const [serviceDetails, setServiceDetails] = useState<{
    id: string;
    title: string;
    price: number;
    provider: string;
    providerId: string;
    category: string;
  } | null>(null);
  const [bookingData, setBookingData] = useState({
    date: "",
    time: "",
    quantity: 1,
    location: "",
    notes: "",
  });

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user?.id) {
      setServiceDetails(null);
      setIsLoadingService(false);
      return;
    }

    let active = true;

    const loadService = async () => {
      if (!serviceId) {
        setIsLoadingService(false);
        return;
      }

      try {
        setIsLoadingService(true);
        const response = await fetch("/api/services", { cache: "no-store" });

        if (response.status === 401) {
          await handleUnauthorized();
          return;
        }

        const payload = await response.json();
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        const match = rows.find(
          (row: any) => String(row.id) === String(serviceId),
        );

        if (!active) return;

        if (!match) {
          setServiceDetails(null);
          return;
        }

        setServiceDetails({
          id: String(match.id),
          title: String(match.name || "Service"),
          price: Number(match.basePrice || 0),
          provider: String(match?.provider?.name || "Provider"),
          providerId: String(match.providerId || providerId || ""),
          category: String(match.category || bookingType || "standard"),
        });
      } catch {
        if (!active) return;
        setServiceDetails(null);
      } finally {
        if (active) setIsLoadingService(false);
      }
    };

    loadService();
    return () => {
      active = false;
    };
  }, [bookingType, handleUnauthorized, isAuthenticated, isLoading, providerId, serviceId, user?.id]);

  const handleConfirmBooking = async () => {
    if (isLoading || !isAuthenticated || !user?.id) {
      alert("Please log in to continue");
      return;
    }

    if (!serviceDetails?.id || !serviceDetails?.providerId) {
      alert(
        "Service details are unavailable. Please go back and reselect a service.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: user.id,
          providerId: serviceDetails.providerId,
          serviceId: serviceDetails.id,
          amount: Math.max(
            1,
            Number(serviceDetails.price || 0) *
              Math.max(1, Number(bookingData.quantity || 1)),
          ),
          currency,
        }),
      });

      if (response.status === 401) {
        await handleUnauthorized();
        return;
      }

      const payload = await response.json();
      if (!response.ok || !payload?.ok || !payload?.data?.id) {
        throw new Error(payload?.error || "Failed to create booking");
      }

      router.push(
        `/customer/booking-confirmation?bookingId=${payload.data.id}`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create booking";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/20 rounded-lg"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">
              {bookingType === "skilled"
                ? "Professional Booking"
                : "Quick Booking"}
            </h1>
            <p className="text-primary-foreground/80 text-sm">
              Step {step} of 3
            </p>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`flex-1 h-2 rounded-full transition-all ${i <= step ? "bg-primary" : "bg-border"}`}
            />
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {isLoadingService && (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">
              Loading service details...
            </p>
          </Card>
        )}

        {!isLoadingService && !serviceDetails && (
          <Card className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Unable to load service details.
            </p>
            <Button
              variant="outline"
              className="bg-transparent"
              onClick={() => router.back()}
            >
              Go Back
            </Button>
          </Card>
        )}

        {/* Step 1: Schedule */}
        {!isLoadingService && serviceDetails && step === 1 && (
          <Card className="p-6 space-y-6">
            <h2 className="text-xl font-bold text-foreground">
              Schedule Your Service
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Select Date
                </label>
                <Input
                  type="date"
                  value={bookingData.date}
                  onChange={(e) =>
                    setBookingData({ ...bookingData, date: e.target.value })
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Select Time
                </label>
                <Input
                  type="time"
                  value={bookingData.time}
                  onChange={(e) =>
                    setBookingData({ ...bookingData, time: e.target.value })
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Duration (hours)
                </label>
                <Input
                  type="number"
                  min="1"
                  value={bookingData.quantity}
                  onChange={(e) =>
                    setBookingData({
                      ...bookingData,
                      quantity: Number.parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>

            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={() => {
                if (bookingData.date && bookingData.time) {
                  setStep(2);
                } else {
                  alert("Please fill all fields");
                }
              }}
            >
              Continue
            </Button>
          </Card>
        )}

        {/* Step 2: Location */}
        {!isLoadingService && serviceDetails && step === 2 && (
          <Card className="p-6 space-y-6">
            <h2 className="text-xl font-bold text-foreground">
              Service Location
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Address
                </label>
                <Input
                  placeholder="Enter full address"
                  value={bookingData.location}
                  onChange={(e) =>
                    setBookingData({ ...bookingData, location: e.target.value })
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Additional Notes
                </label>
                <textarea
                  placeholder="Any special instructions or details..."
                  value={bookingData.notes}
                  onChange={(e) =>
                    setBookingData({ ...bookingData, notes: e.target.value })
                  }
                  className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={() => {
                  if (bookingData.location) {
                    setStep(3);
                  } else {
                    alert("Please enter location");
                  }
                }}
              >
                Continue
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Confirmation */}
        {!isLoadingService && serviceDetails && step === 3 && (
          <Card className="p-6 space-y-6">
            <h2 className="text-xl font-bold text-foreground">
              Confirm Your Booking
            </h2>

            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Service:</span>
                <span className="font-semibold text-foreground">
                  {serviceDetails.title}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Provider:</span>
                <span className="font-semibold text-foreground">
                  {serviceDetails.provider}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Date & Time:</span>
                <span className="font-semibold text-foreground">
                  {bookingData.date} at {bookingData.time}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Location:</span>
                <span className="font-semibold text-foreground">
                  {bookingData.location}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 bg-primary/10 px-3 rounded-lg">
                <span className="font-semibold text-foreground">
                  Total Cost:
                </span>
                <span className="text-lg font-bold text-primary">
                  {currency}{" "}
                  {(
                    serviceDetails.price * bookingData.quantity
                  ).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => setStep(2)}
              >
                Back
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={handleConfirmBooking}
                disabled={isSubmitting}
              >
                <Check className="w-4 h-4 mr-2" />
                {isSubmitting ? "Processing..." : "Confirm & Pay"}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
