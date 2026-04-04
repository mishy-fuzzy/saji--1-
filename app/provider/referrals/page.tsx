"use client";

import { useEffect, useMemo, useState } from "react";
import { Gift, Copy, Share2, Users, DollarSign, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ReferralItem = {
  id: string;
  name: string;
  date: string;
  status: string;
  earned: number;
};

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState("SAJI-SAJI-0000");
  const [referralLink, setReferralLink] = useState("https://saji.app/join");
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [stats, setStats] = useState({ invited: 0, completed: 0, earned: 0 });

  useEffect(() => {
    const loadReferrals = async () => {
      try {
        const response = await fetch("/api/provider/referrals", {
          cache: "no-store",
        });
        const payload = await response.json();
        if (!response.ok || !payload?.ok) {
          setReferrals([]);
          setStats({ invited: 0, completed: 0, earned: 0 });
          return;
        }

        setReferralCode(
          String(payload?.data?.referralCode || "SAJI-SAJI-0000"),
        );
        setReferralLink(
          String(payload?.data?.referralLink || "https://saji.app/join"),
        );
        setReferrals(
          Array.isArray(payload?.data?.referrals) ? payload.data.referrals : [],
        );
        setStats({
          invited: Number(payload?.data?.stats?.invited || 0),
          completed: Number(payload?.data?.stats?.completed || 0),
          earned: Number(payload?.data?.stats?.earned || 0),
        });
      } catch {
        setReferrals([]);
        setStats({ invited: 0, completed: 0, earned: 0 });
      }
    };

    loadReferrals();

    const interval = window.setInterval(loadReferrals, 15000);
    return () => window.clearInterval(interval);
  }, []);

  const totals = useMemo(() => {
    return {
      count: stats.invited,
      active: stats.completed,
      earned: stats.earned,
    };
  }, [stats]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
    } catch {
      // ignore clipboard failures
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Join SAJI",
          text: "Join SAJI using my referral link.",
          url: referralLink,
        });
      } else {
        await handleCopy();
      }
    } catch {
      await handleCopy();
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Referral Program</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Invite other providers and earn rewards for successful referrals
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 border border-border rounded-xl text-center">
          <Users className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-xl font-bold text-foreground">{totals.count}</p>
          <p className="text-[10px] text-muted-foreground">Referrals</p>
        </Card>
        <Card className="p-3 border border-border rounded-xl text-center">
          <Check className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-foreground">{totals.active}</p>
          <p className="text-[10px] text-muted-foreground">Active</p>
        </Card>
        <Card className="p-3 border border-border rounded-xl text-center">
          <DollarSign className="w-4 h-4 text-amber-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-foreground">
            KES {totals.earned.toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground">Earned</p>
        </Card>
      </div>

      <Card className="p-5 border border-border rounded-xl text-center space-y-3">
        <Gift className="w-10 h-10 text-primary mx-auto" />
        <h2 className="font-bold text-foreground text-lg">
          Your Referral Code
        </h2>
        <div className="bg-muted rounded-xl p-3 flex items-center justify-center gap-3">
          <span className="text-lg font-mono font-bold text-foreground tracking-wider">
            {referralCode}
          </span>
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg hover:bg-card transition-colors"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleCopy}
            variant="outline"
            className="flex-1 rounded-xl"
          >
            <Copy className="w-4 h-4 mr-1" />
            {copied ? "Copied!" : "Copy Link"}
          </Button>
          <Button onClick={handleShare} className="flex-1 rounded-xl">
            <Share2 className="w-4 h-4 mr-1" />
            Share
          </Button>
        </div>
      </Card>

      <Card className="p-4 border border-border rounded-xl">
        <h3 className="font-semibold text-foreground mb-3">Your Referrals</h3>
        <div className="space-y-2">
          {referrals.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {row.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {row.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {row.date}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    row.status === "active"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}
                >
                  {row.status === "active" ? "Active" : "Pending"}
                </span>
                {row.earned > 0 && (
                  <p className="text-xs font-medium text-emerald-600 mt-0.5">
                    +KES {row.earned}
                  </p>
                )}
              </div>
            </div>
          ))}

          {referrals.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No referrals yet.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
