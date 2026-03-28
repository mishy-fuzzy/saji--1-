"use client";

import { useState } from "react";
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
  ArrowRight,
  Share2,
  MessageCircle,
  Clock,
} from "lucide-react";
import Image from "next/image";

interface Referral {
  id: number;
  name: string;
  avatar: string;
  date: string;
  status: "pending" | "completed";
  earned: number;
}

const referrals: Referral[] = [];

const REWARD_AMOUNT = 500;
const FRIEND_DISCOUNT = 300;

export function CustomerReferralsPage() {
  const { user } = useAuthContext();
  const [copied, setCopied] = useState(false);
  const referralCode =
    "SAJI-" + (user?.name?.toUpperCase().slice(0, 4) || "USER") + "2024";
  const totalEarned = referrals
    .filter((r) => r.status === "completed")
    .reduce((sum, r) => sum + r.earned, 0);
  const completedCount = referrals.filter(
    (r) => r.status === "completed",
  ).length;

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareMessage = `Join SAJI and get KES ${FRIEND_DISCOUNT} off your first service! Use my referral code: ${referralCode}. Download: https://saji.co.ke`;

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
                  {copied ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
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
              {referrals.length}
            </p>
            <p className="text-[11px] text-muted-foreground">Invited</p>
          </Card>
          <Card className="p-4 border-0 shadow-sm text-center">
            <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
            <p className="text-xl font-bold text-foreground">
              {completedCount}
            </p>
            <p className="text-[11px] text-muted-foreground">Completed</p>
          </Card>
          <Card className="p-4 border-0 shadow-sm text-center">
            <Wallet className="w-5 h-5 text-amber-600 mx-auto mb-1.5" />
            <p className="text-xl font-bold text-foreground">
              KES {totalEarned.toLocaleString()}
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
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {item.step}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                {i < 3 && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground/30 mt-2 shrink-0 hidden sm:block" />
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
