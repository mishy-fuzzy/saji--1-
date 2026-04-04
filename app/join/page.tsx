"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function JoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const trackOpen = async (payload: {
      referrerId: string;
      referralCode?: string;
      role?: string;
    }) => {
      try {
        await fetch("/api/referrals/track-open", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        });
      } catch {
        // Keep redirect reliable even if analytics tracking fails.
      }
    };

    const params = new URLSearchParams();

    const role = String(searchParams.get("role") || "").trim().toLowerCase();
    const ref = String(searchParams.get("ref") || "").trim();
    const rid = String(searchParams.get("rid") || "").trim();

    if (rid) {
      trackOpen({ referrerId: rid, referralCode: ref || undefined, role: role || undefined });
    }

    if (role === "customer" || role === "provider" || role === "shopkeeper") {
      params.set("role", role);
    }
    if (ref) {
      params.set("ref", ref);
    }
    if (rid) {
      params.set("rid", rid);
    }

    const nextUrl = params.toString()
      ? `/auth/signup?${params.toString()}`
      : "/auth/signup";

    router.replace(nextUrl);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center">
      <p className="text-sm text-muted-foreground">Opening referral link...</p>
    </div>
  );
}
