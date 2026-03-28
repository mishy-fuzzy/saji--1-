"use client";

import { ArrowLeft, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/lib/auth-context";

type BookingRecord = {
  id: string;
  status?: string;
  amount?: number;
  createdAt: string;
  customer?: { name?: string | null } | null;
  service?: { name?: string | null } | null;
};

type RatingRow = {
  id: string;
  customer: string;
  rating: number;
  comment: string;
  date: string;
};

export default function RatingsPage() {
  const { user } = useAuthContext();
  const [ratings, setRatings] = useState<RatingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRatings = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/bookings?providerId=${encodeURIComponent(user.id)}`,
          { cache: "no-store" },
        );
        const payload = await response.json();
        const bookings: BookingRecord[] = Array.isArray(payload?.data)
          ? payload.data
          : [];

        const completed = bookings.filter(
          (item) => String(item.status || "").toLowerCase() === "completed",
        );
        const completionScore = Math.max(
          1,
          Math.min(
            5,
            Math.round((completed.length / Math.max(bookings.length, 1)) * 5),
          ),
        );

        const mapped = completed.slice(0, 20).map((item) => {
          return {
            id: item.id,
            customer: String(item.customer?.name || "Customer"),
            rating: completionScore,
            comment: `Completed ${String(item.service?.name || "service job")} successfully.`,
            date: new Date(item.createdAt).toLocaleDateString(),
          };
        });

        setRatings(mapped);
      } catch {
        setRatings([]);
      } finally {
        setLoading(false);
      }
    };

    loadRatings();
  }, [user?.id]);

  const avgRating = useMemo(() => {
    if (ratings.length === 0) return "0.0";
    return (
      ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    ).toFixed(1);
  }, [ratings]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 lg:pb-0">
      {/* Header */}
      <div className="bg-blue-600 dark:bg-blue-700 text-white p-4 rounded-b-2xl lg:rounded-none">
        <div className="flex items-center gap-4 max-w-4xl mx-auto">
          <Link href="/provider/profile" className="lg:hidden">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold">Star Ratings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-2xl mx-auto lg:max-w-4xl space-y-6">
        {/* Average Rating */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border dark:border-gray-700 text-center">
          <div className="flex justify-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="w-5 h-5 fill-yellow-400 text-yellow-400"
              />
            ))}
          </div>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">
            {avgRating}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Based on {ratings.length} completed jobs
          </p>
        </div>

        {/* Reviews */}
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
              Loading ratings...
            </div>
          ) : ratings.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
              No completed jobs yet. Ratings will appear after your first
              completed bookings.
            </div>
          ) : (
            ratings.map((review) => (
              <div
                key={review.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {review.customer}
                  </p>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {review.comment}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {review.date}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
