"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Heart,
  Star,
  MapPin,
  Phone,
  Clock,
  CheckCircle,
  Briefcase,
  X,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface FavoriteProvider {
  id: number;
  name: string;
  avatar: string;
  specialty: string;
  rating: number;
  reviews: number;
  distance: string;
  hourlyRate: number;
  available: boolean;
  verified: boolean;
  completedJobs: number;
  lastHired?: string;
}

const initialFavorites: FavoriteProvider[] = [];

export function CustomerFavoritesPage() {
  const [favorites, setFavorites] = useState(initialFavorites);
  const [removed, setRemoved] = useState<FavoriteProvider[]>([]);

  const removeFavorite = (id: number) => {
    const fav = favorites.find((f) => f.id === id);
    if (fav) {
      setRemoved((prev) => [fav, ...prev]);
      setFavorites((prev) => prev.filter((f) => f.id !== id));
    }
  };
  const restoreFavorite = (id: number) => {
    const fav = removed.find((f) => f.id === id);
    if (fav) {
      setFavorites((prev) => [...prev, fav]);
      setRemoved((prev) => prev.filter((f) => f.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500" /> Favorite Providers
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {favorites.length} saved providers for quick rebooking
          </p>
        </div>

        {/* Undo bar */}
        {removed.length > 0 && (
          <div className="flex items-center justify-between bg-muted/50 p-3 rounded-xl mb-4">
            <p className="text-sm text-muted-foreground">
              Removed {removed[0].name}
            </p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => restoreFavorite(removed[0].id)}
              className="gap-1.5 text-xs"
            >
              <RotateCcw className="w-3 h-3" />
              Undo
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {favorites.length > 0 ? (
            favorites.map((provider) => (
              <Card
                key={provider.id}
                className="p-4 border-0 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex gap-4">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-border group-hover:ring-primary/30 transition-all">
                      <Image
                        src={provider.avatar || "/placeholder.svg"}
                        alt={provider.name}
                        width={64}
                        height={64}
                        className="object-cover"
                      />
                    </div>
                    {provider.available && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-card flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground">
                          {provider.name}
                        </h3>
                        {provider.verified && (
                          <span className="bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <CheckCircle className="w-3 h-3 text-blue-600 fill-blue-600" />
                            <span className="text-[10px] font-medium text-blue-700 dark:text-blue-300">
                              Verified
                            </span>
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeFavorite(provider.id)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4 text-muted-foreground hover:text-red-500" />
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {provider.specialty}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <strong className="text-foreground">
                          {provider.rating}
                        </strong>{" "}
                        ({provider.reviews})
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {provider.distance}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {provider.completedJobs} jobs
                      </span>
                      {provider.lastHired && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Hired {provider.lastHired}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-foreground">
                        KES {provider.hourlyRate.toLocaleString()}
                        <span className="text-xs font-normal text-muted-foreground">
                          /hr
                        </span>
                      </p>
                      <div className="flex gap-2">
                        <Link href={`/customer/find-specialists`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl bg-transparent text-xs h-8"
                          >
                            View
                          </Button>
                        </Link>
                        <Link href="/customer/services">
                          <Button
                            size="sm"
                            className="rounded-xl text-xs h-8"
                            disabled={!provider.available}
                          >
                            {provider.available ? "Rebook" : "Unavailable"}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center border-0 shadow-sm">
              <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-base font-semibold text-foreground mb-1">
                No favorites yet
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Save providers you like for quick rebooking
              </p>
              <Link href="/customer/find-specialists">
                <Button className="rounded-xl">Find Providers</Button>
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
