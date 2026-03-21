"use client"

import { useState } from "react"
import { Gift, Copy, Share2, Users, DollarSign, Check, ChevronRight, Star, Clock } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false)
  const referralCode = "MIKE-SAJI-2026"
  const referralLink = `https://saji.app/join?ref=${referralCode}`

  const referrals = [
    { name: "James Omondi", date: "2026-02-15", status: "active", earned: 500 },
    { name: "Lucy Wambui", date: "2026-02-10", status: "active", earned: 500 },
    { name: "David Njoroge", date: "2026-01-28", status: "pending", earned: 0 },
    { name: "Ann Chebet", date: "2026-01-20", status: "active", earned: 500 },
  ]

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(referralLink) } catch { /* ignore */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    try {
      if (navigator.share) await navigator.share({ title: "Join SAJI", text: `Join SAJI using my referral link and earn KES 500!`, url: referralLink })
      else handleCopy()
    } catch { handleCopy() }
  }

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Referral Program</h1>
        <p className="text-sm text-muted-foreground mt-1">Invite other providers and earn KES 500 for each successful referral</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 border border-border rounded-xl text-center">
          <Users className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-xl font-bold text-foreground">{referrals.length}</p>
          <p className="text-[10px] text-muted-foreground">Referrals</p>
        </Card>
        <Card className="p-3 border border-border rounded-xl text-center">
          <Check className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-foreground">{referrals.filter(r => r.status === "active").length}</p>
          <p className="text-[10px] text-muted-foreground">Active</p>
        </Card>
        <Card className="p-3 border border-border rounded-xl text-center">
          <DollarSign className="w-4 h-4 text-amber-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-foreground">KES {referrals.reduce((a, r) => a + r.earned, 0).toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Earned</p>
        </Card>
      </div>

      {/* Referral Code */}
      <Card className="p-5 border border-border rounded-xl text-center space-y-3">
        <Gift className="w-10 h-10 text-primary mx-auto" />
        <h2 className="font-bold text-foreground text-lg">Your Referral Code</h2>
        <div className="bg-muted rounded-xl p-3 flex items-center justify-center gap-3">
          <span className="text-lg font-mono font-bold text-foreground tracking-wider">{referralCode}</span>
          <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-card transition-colors">
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
          </button>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCopy} variant="outline" className="flex-1 rounded-xl"><Copy className="w-4 h-4 mr-1" />{copied ? "Copied!" : "Copy Link"}</Button>
          <Button onClick={handleShare} className="flex-1 rounded-xl"><Share2 className="w-4 h-4 mr-1" />Share</Button>
        </div>
      </Card>

      {/* How it works */}
      <Card className="p-4 border border-border rounded-xl">
        <h3 className="font-semibold text-foreground mb-3">How it works</h3>
        <div className="space-y-3">
          {[
            { step: "1", title: "Share your code", desc: "Send your unique referral code to another service provider" },
            { step: "2", title: "They sign up", desc: "They register on SAJI using your referral code" },
            { step: "3", title: "Complete first job", desc: "Once they complete their first job, you both earn KES 500" },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">{s.step}</div>
              <div>
                <p className="text-sm font-medium text-foreground">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Referral History */}
      <Card className="p-4 border border-border rounded-xl">
        <h3 className="font-semibold text-foreground mb-3">Your Referrals</h3>
        <div className="space-y-2">
          {referrals.map((r, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{r.name.charAt(0)}</div>
                <div>
                  <p className="text-sm font-medium text-foreground">{r.name}</p>
                  <p className="text-[10px] text-muted-foreground">{r.date}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${r.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>{r.status === "active" ? "Active" : "Pending"}</span>
                {r.earned > 0 && <p className="text-xs font-medium text-emerald-600 mt-0.5">+KES {r.earned}</p>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
