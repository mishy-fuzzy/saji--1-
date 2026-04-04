"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, X, Loader2, CheckCircle2 } from "lucide-react";

const STORAGE_KEY = "saji-newsletter-popup-dismissed-at";
const RESHOW_MS = 7 * 24 * 60 * 60 * 1000;
const SUBSCRIBED_KEY = "saji-newsletter-subscribed";
const SESSION_DISMISSED_KEY = "saji-newsletter-dismissed-session";

export function NewsletterPopup() {
  const { user } = useAuthContext();
  const [open, setOpen] = useState(false);
  const [showLauncher, setShowLauncher] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forceShow = params.get("newsletter") === "1";
    const subscribed = localStorage.getItem(SUBSCRIBED_KEY) === "1";

    if (subscribed && !forceShow) {
      setOpen(false);
      setShowLauncher(false);
      return;
    }

    setShowLauncher(true);

    const sessionDismissed = sessionStorage.getItem(SESSION_DISMISSED_KEY) === "1";
    const dismissedAtRaw = localStorage.getItem(STORAGE_KEY);
    const dismissedAt = Number(dismissedAtRaw || "0");
    const allowShow = forceShow || !dismissedAt || Date.now() - dismissedAt > RESHOW_MS;

    if (!allowShow) {
      return;
    }

    if (sessionDismissed && !forceShow) {
      return;
    }

    const timer = window.setTimeout(() => {
      setEmail(String(user?.email || ""));
      setOpen(true);
      setShowLauncher(false);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [user?.email]);

  const canSubmit = useMemo(() => {
    return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email);
  }, [email]);

  const closePopup = () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    sessionStorage.setItem(SESSION_DISMISSED_KEY, "1");
    setOpen(false);
    setShowLauncher(true);
  };

  const onSubscribe = async () => {
    if (!canSubmit || loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: String(user?.name || ""),
          source: "global-popup",
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Failed to subscribe");
      }

      setSubscribed(true);
      localStorage.setItem(SUBSCRIBED_KEY, "1");
      sessionStorage.removeItem(SESSION_DISMISSED_KEY);
      setTimeout(() => {
        closePopup();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to subscribe");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    if (!showLauncher) return null;

    return (
      <button
        type="button"
        onClick={() => {
          setEmail(String(user?.email || ""));
          setOpen(true);
          setShowLauncher(false);
        }}
        className="fixed bottom-4 right-4 z-[85] rounded-full bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-amber-600"
      >
        Newsletter
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl rounded-2xl overflow-hidden">
        <div className="bg-linear-to-r from-amber-500 to-orange-500 text-white p-5 relative">
          <button
            type="button"
            onClick={closePopup}
            className="absolute top-3 right-3 rounded-md p-1 hover:bg-white/15"
            aria-label="Close newsletter popup"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-5 h-5" />
            <p className="font-semibold">Stay in the loop</p>
          </div>
          <p className="text-sm text-white/90">Get service deals, product updates, and referral boosts in your inbox.</p>
        </div>

        <div className="p-5 space-y-3">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={loading || subscribed}
          />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button
            type="button"
            onClick={onSubscribe}
            disabled={!canSubmit || loading || subscribed}
            className="w-full rounded-xl"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {subscribed ? <CheckCircle2 className="w-4 h-4 mr-2" /> : null}
            {subscribed ? "Subscribed" : "Subscribe"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">You can dismiss this now and we will remind you in 7 days.</p>
        </div>
      </Card>
    </div>
  );
}
