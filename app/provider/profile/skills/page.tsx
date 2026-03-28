"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Award, MapPin } from "lucide-react";
import Link from "next/link";
import { useAuthContext } from "@/lib/auth-context";

type ServiceRecord = {
  id: string;
  category?: string | null;
};

type BookingRecord = {
  id: string;
  customer?: {
    name?: string | null;
  } | null;
};

export default function SkillsPage() {
  const { user } = useAuthContext();
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const [servicesResponse, bookingsResponse] = await Promise.all([
          fetch("/api/services", { cache: "no-store" }),
          fetch(`/api/bookings?providerId=${encodeURIComponent(user.id)}`, {
            cache: "no-store",
          }),
        ]);

        const servicesPayload = await servicesResponse.json();
        const bookingsPayload = await bookingsResponse.json();

        const allServices = Array.isArray(servicesPayload?.data)
          ? servicesPayload.data
          : [];
        const providerServices = allServices.filter(
          (service: any) => String(service?.providerId || "") === user.id,
        );
        const providerBookings = Array.isArray(bookingsPayload?.data)
          ? bookingsPayload.data
          : [];

        setServices(providerServices);
        setBookings(providerBookings);
      } catch {
        setServices([]);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  const skills = useMemo(() => {
    const categories = Array.from(
      new Set(
        services
          .map((service) => String(service.category || "").trim())
          .filter(Boolean),
      ),
    );

    return categories.map((name, index) => ({
      id: `${name}-${index}`,
      name,
      verified: true,
    }));
  }, [services]);

  const workAreas = useMemo(() => {
    const names = Array.from(
      new Set(
        bookings
          .map((booking) => String(booking.customer?.name || "").trim())
          .filter(Boolean),
      ),
    );
    return names.slice(0, 8);
  }, [bookings]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 lg:pb-0">
      {/* Header */}
      <div className="bg-blue-600 dark:bg-blue-700 text-white p-4 rounded-b-2xl lg:rounded-none">
        <div className="flex items-center gap-4 max-w-4xl mx-auto">
          <Link href="/provider/profile" className="lg:hidden">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold">Work Area & Skills</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-2xl mx-auto lg:max-w-4xl space-y-6">
        {/* Skills Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Professional Skills
          </h2>

          {/* Skills List */}
          <div className="space-y-2">
            {loading ? (
              <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                Loading skills...
              </div>
            ) : skills.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                No skills available yet. Add services to build your skills
                profile.
              </div>
            ) : (
              skills.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 dark:text-white font-medium">
                      {skill.name}
                    </span>
                    {skill.verified && (
                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Work Areas Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Work Areas
          </h2>

          {/* Work Areas List */}
          <div className="flex flex-wrap gap-2">
            {loading ? (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Loading service areas...
              </div>
            ) : workAreas.length === 0 ? (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                No recent client locations found yet.
              </div>
            ) : (
              workAreas.map((area) => (
                <div
                  key={area}
                  className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 px-3 py-2 rounded-full"
                >
                  <span className="text-blue-900 dark:text-blue-400 font-medium">
                    {area}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
