"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Gift,
  Copy,
  CheckCircle,
  Users,
  Wallet,
  ArrowDown,
  Share2,
  MessageCircle,
  Clock,
  Link2,
} from "lucide-react";
import Image from "next/image";

interface Referral {
  id: string;
  name: string;
  avatar: string;
  date: string;
  status: "pending" | "completed";
  earned: number;
}

const REWARD_AMOUNT = 500;
const FRIEND_DISCOUNT = 300;

export function CustomerReferralsPage() {
  const { user } = useAuthContext();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralCode, setReferralCode] = useState("CUS-SAJI-0000");
  const [referralLink, setReferralLink] = useState("https://saji.co.ke/join");
  const [stats, setStats] = useState({ invited: 0, completed: 0, earned: 0 });

  const fallbackReferralLink = useMemo(() => {
    if (typeof window === "undefined") return "https://saji.co.ke/join";
    const baseUrl = window.location.origin;
    return `${baseUrl}/join?ref=${encodeURIComponent(referralCode)}${user?.id ? `&rid=${encodeURIComponent(user.id)}` : ""}&role=customer`;
  }, [referralCode, user?.id]);

  useEffect(() => {
    const loadReferrals = async () => {
      try {
        const response = await fetch("/api/customer/referrals", {
          cache: "no-store",
          headers: {
            "x-user-role": "customer",
          },
        });
        const payload = await response.json();

        if (!response.ok || !payload?.ok || !payload?.data) {
          setReferrals([]);
          setReferralLink(fallbackReferralLink);
          setStats({ invited: 0, completed: 0, earned: 0 });
          return;
        }

        setReferralCode(String(payload?.data?.referralCode || "CUS-SAJI-0000"));
        setReferralLink(String(payload?.data?.referralLink || fallbackReferralLink));
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
        setReferralLink(fallbackReferralLink);
        setStats({ invited: 0, completed: 0, earned: 0 });
      }
    };

    loadReferrals();

    const interval = window.setInterval(loadReferrals, 15000);
    return () => window.clearInterval(interval);
  }, [fallbackReferralLink]);

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareMessage = useMemo(
    () =>
      `Join SAJI and get KES ${FRIEND_DISCOUNT} off your first service! Use my referral code: ${referralCode}. Sign up here: ${referralLink}`,
    [referralCode, referralLink],
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8">
        {/* Hero Card */}
        <Card className="p-6 mb-6 border-0 shadow-lg bg-linear-to-br from-primary via-primary/95 to-blue-700 text-primary-foreground rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
              <Gift className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Refer & Earn</h1>
            <p className="text-primary-foreground/80 text-sm mb-5">
              Invite friends to SAJI and earn{" "}
              <strong>KES {REWARD_AMOUNT}</strong> for each friend who completes
              their first booking. They get{" "}
              <strong>KES {FRIEND_DISCOUNT} off</strong> too!
            </p>

            {/* Referral Code */}
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
              <p className="text-xs text-primary-foreground/70 mb-2 uppercase tracking-wider font-medium">
                Your referral code
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white/20 rounded-lg px-4 py-3 font-mono text-lg font-bold tracking-wider">
                  {referralCode}
                </div>
                <Button
                  onClick={copyCode}
                  className="bg-white text-primary hover:bg-white/90 h-12 px-4 rounded-lg"
                >
                  {copiedCode ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Referral Link */}
            <div className="mt-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <p className="text-[11px] text-primary-foreground/70 mb-2 uppercase tracking-wider font-medium">
                Your referral link
              </p>
              <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-2 py-1 text-[11px] font-medium text-emerald-200">
                <Link2 className="h-3 w-3" />
                Configured
              </p>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={referralLink}
                  className="h-10 bg-white/15 border-white/30 text-primary-foreground placeholder:text-primary-foreground/70"
                />
                <Button
                  onClick={copyLink}
                  className="bg-white text-primary hover:bg-white/90 h-10 px-3 rounded-lg"
                >
                  {copiedLink ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="p-4 border-0 shadow-sm text-center">
            <Users className="w-5 h-5 text-primary mx-auto mb-1.5" />
            <p className="text-xl font-bold text-foreground">
              {stats.invited}
            </p>
            <p className="text-[11px] text-muted-foreground">Invited</p>
          </Card>
          <Card className="p-4 border-0 shadow-sm text-center">
            <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
            <p className="text-xl font-bold text-foreground">
              {stats.completed}
            </p>
            <p className="text-[11px] text-muted-foreground">Completed</p>
          </Card>
          <Card className="p-4 border-0 shadow-sm text-center">
            <Wallet className="w-5 h-5 text-amber-600 mx-auto mb-1.5" />
            <p className="text-xl font-bold text-foreground">
              KES {stats.earned.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground">Earned</p>
          </Card>
        </div>

        {/* Share Options */}
        <Card className="p-5 border-0 shadow-sm mb-6">
          <h3 className="font-semibold text-foreground mb-3">
            Share with friends
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="rounded-xl bg-transparent gap-2 h-11"
              onClick={() => {
                if (typeof navigator.share !== "undefined") {
                  navigator.share({ text: shareMessage });
                }
              }}
            >
              <Share2 className="w-4 h-4" />
              Share Link
            </Button>
            <Button
              variant="outline"
              className="rounded-xl bg-transparent gap-2 h-11"
              onClick={() =>
                window.open(
                  `https://wa.me/?text=${encodeURIComponent(shareMessage)}`,
                )
              }
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>
          </div>
        </Card>

        {/* How it works */}
        <Card className="p-5 border-0 shadow-sm mb-6">
          <h3 className="font-semibold text-foreground mb-4">How it works</h3>
          <div className="space-y-4">
            {[
              {
                step: "1",
                title: "Share your code",
                desc: "Send your referral code to friends",
              },
              {
                step: "2",
                title: "Friend signs up",
                desc: "They create a SAJI account using your code",
              },
              {
                step: "3",
                title: "Friend books a service",
                desc: `They get KES ${FRIEND_DISCOUNT} off their first booking`,
              },
              {
                step: "4",
                title: "You get rewarded",
                desc: `KES ${REWARD_AMOUNT} is added to your wallet`,
              },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm">
                    <span className="text-sm font-bold">{item.step}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                {i < 3 && (
                  <div className="ml-3.5 mt-1 flex items-center gap-2 text-primary">
                    <ArrowDown className="h-4 w-4 animate-pulse" />
                    <span className="text-[11px] font-medium">Next step</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Referral History */}
        <div>
          <h3 className="font-semibold text-foreground mb-3">
            Referral History
          </h3>
          <div className="space-y-2">
            {referrals.length === 0 && (
              <Card className="p-6 text-center border-0 shadow-sm">
                <p className="text-sm font-medium text-foreground mb-1">
                  No referrals yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Share your code to start earning rewards.
                </p>
              </Card>
            )}
            {referrals.map((ref) => (
              <Card key={ref.id} className="p-3 border-0 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <Image
                      src={ref.avatar || "/placeholder.svg"}
                      alt={ref.name}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">
                      {ref.name}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {ref.date}
                    </p>
                  </div>
                  <div className="text-right">
                    {ref.status === "completed" ? (
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        +KES {ref.earned}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
