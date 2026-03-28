"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useLocalization } from "@/lib/hooks/useLocalization";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, Clock, ArrowLeft, Phone, MessageCircle } from "lucide-react";
import Image from "next/image";

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currency } = useLocalization();
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [service, setService] = useState<any | null>(null);

  const serviceId = params.id as string;

  useEffect(() => {
    let active = true;

    const loadService = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/services", { cache: "no-store" });
        const payload = await response.json();
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        const found =
          rows.find((row: any) => String(row.id) === String(serviceId)) || null;
        if (active) setService(found);
      } catch {
        if (active) setService(null);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadService();
    return () => {
      active = false;
    };
  }, [serviceId]);

  const providers = useMemo(() => {
    if (!service) return [];
    return [
      {
        id: String(service.providerId || ""),
        name: String(service?.provider?.name || "Provider"),
        rating: 5,
        reviews: 0,
        price: Number(service.basePrice || 0),
        responseTime: "Live",
        jobs: 0,
        bio: String(service.description || "Professional service provider"),
        image: String(service?.provider?.image || "/placeholder.svg"),
        verified: true,
      },
    ];
  }, [service]);

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
            <h1 className="text-2xl font-bold">{service?.name || "Service"}</h1>
            <p className="text-primary-foreground/80 text-sm">
              Choose a provider
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {isLoading && (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">
              Loading service details...
            </p>
          </Card>
        )}

        {!isLoading && !service && (
          <Card className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">Service not found.</p>
            <Button
              variant="outline"
              className="bg-transparent"
              onClick={() => router.back()}
            >
              Go Back
            </Button>
          </Card>
        )}

        {/* Service Image */}
        {!isLoading && service && (
          <Card className="overflow-hidden">
            <div className="relative w-full h-48 md:h-64 bg-muted">
              <Image
                src={service.image || "/placeholder.svg"}
                alt={service.name || "Service"}
                fill
                className="object-cover"
              />
            </div>
          </Card>
        )}

        {/* Service Info */}
        {!isLoading && service && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {service.name}
            </h2>
            <p className="text-muted-foreground">{service.description}</p>
          </Card>
        )}

        {/* Available Providers */}
        {!isLoading && service && (
          <div>
            <h3 className="text-xl font-bold text-foreground mb-4">
              Available Providers
            </h3>
            <div className="space-y-3">
              {providers.map((provider) => (
                <Card
                  key={provider.id}
                  className={`p-4 cursor-pointer transition-all border-2 ${
                    selectedProvider === provider.id
                      ? "border-primary bg-primary/5"
                      : "border-transparent hover:border-primary/30"
                  }`}
                  onClick={() => setSelectedProvider(provider.id)}
                >
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative w-16 h-16 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                      <Image
                        src={provider.image || "/placeholder.svg"}
                        alt={provider.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-foreground flex items-center gap-2">
                            {provider.name}
                            {provider.verified && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                Verified
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {provider.bio}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-primary">
                            {currency} {provider.price.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            per service
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">
                            {provider.rating}
                          </span>
                          <span className="text-muted-foreground">
                            ({provider.reviews})
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{provider.responseTime}</span>
                        </div>
                        <div className="text-muted-foreground">
                          {provider.jobs} jobs
                        </div>
                      </div>

                      {selectedProvider === provider.id && (
                        <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                          <Button
                            className="flex-1 bg-primary hover:bg-primary/90"
                            onClick={() =>
                              router.push(
                                `/customer/booking?provider=${provider.id}&service=${serviceId}&type=${String(service.category || "standard")}`,
                              )
                            }
                          >
                            Book Now
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 bg-transparent"
                            size="sm"
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Message
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 bg-transparent"
                            size="sm"
                          >
                            <Phone className="w-4 h-4 mr-1" />
                            Call
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
