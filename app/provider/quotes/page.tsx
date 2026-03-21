"use client"

import { useState } from "react"
import { FileText, Send, Clock, Check, X, Plus, Search, MessageCircle, DollarSign, ChevronDown, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent } from "@/components/ui/dialog"

type Quote = {
  id: string; jobTitle: string; client: string; clientLocation: string
  description: string; amount: number; validDays: number
  status: "draft" | "sent" | "accepted" | "rejected" | "expired"
  sentDate: string; items: { desc: string; qty: number; rate: number }[]
  notes: string
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([
    { id: "QT-001", jobTitle: "Kitchen Renovation", client: "Sarah Wanjiku", clientLocation: "Westlands", description: "Full kitchen plumbing overhaul including new pipes and fixtures", amount: 45000, validDays: 14, status: "accepted", sentDate: "2026-02-10", items: [{ desc: "Materials", qty: 1, rate: 25000 }, { desc: "Labor (5 days)", qty: 5, rate: 4000 }], notes: "Price includes all materials and cleanup." },
    { id: "QT-002", jobTitle: "Office Electrical Upgrade", client: "Kamau Enterprises", clientLocation: "Kilimani", description: "Upgrade electrical panel and add new circuits for office expansion", amount: 78000, validDays: 7, status: "sent", sentDate: "2026-02-18", items: [{ desc: "Electrical panel", qty: 1, rate: 35000 }, { desc: "Wiring & circuits", qty: 1, rate: 23000 }, { desc: "Labor (4 days)", qty: 4, rate: 5000 }], notes: "Estimate may vary if additional circuits needed." },
    { id: "QT-003", jobTitle: "Bathroom Waterproofing", client: "Grace Muthoni", clientLocation: "Karen", description: "Waterproof entire master bathroom and fix existing leaks", amount: 32000, validDays: 10, status: "rejected", sentDate: "2026-02-05", items: [{ desc: "Waterproofing material", qty: 1, rate: 15000 }, { desc: "Leak repair", qty: 1, rate: 7000 }, { desc: "Labor (2 days)", qty: 2, rate: 5000 }], notes: "" },
    { id: "QT-004", jobTitle: "Garden Irrigation System", client: "Peter Odhiambo", clientLocation: "South B", description: "Install drip irrigation system for garden and lawn", amount: 28000, validDays: 14, status: "draft", sentDate: "", items: [{ desc: "Irrigation kit", qty: 1, rate: 18000 }, { desc: "Installation", qty: 1, rate: 10000 }], notes: "Timer system included." },
  ])
  const [showCreate, setShowCreate] = useState(false)
  const [filterStatus, setFilterStatus] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedQuote, setExpandedQuote] = useState<string | null>(null)
  const [newQuote, setNewQuote] = useState({ jobTitle: "", client: "", clientLocation: "", description: "", validDays: 14, items: [{ desc: "", qty: 1, rate: 0 }], notes: "" })

  const filtered = quotes
    .filter(q => filterStatus === "All" || q.status === filterStatus.toLowerCase())
    .filter(q => q.client.toLowerCase().includes(searchQuery.toLowerCase()) || q.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()))

  const statusColors: Record<string, string> = {
    accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    expired: "bg-muted text-muted-foreground",
    draft: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  }

  const addItem = () => setNewQuote(p => ({ ...p, items: [...p.items, { desc: "", qty: 1, rate: 0 }] }))

  const createQuote = () => {
    const amount = newQuote.items.reduce((a, i) => a + i.qty * i.rate, 0)
    const q: Quote = {
      id: `QT-${String(quotes.length + 1).padStart(3, "0")}`, jobTitle: newQuote.jobTitle, client: newQuote.client,
      clientLocation: newQuote.clientLocation, description: newQuote.description, amount,
      validDays: newQuote.validDays, status: "draft", sentDate: "", items: newQuote.items, notes: newQuote.notes,
    }
    setQuotes(prev => [q, ...prev])
    setShowCreate(false)
    setNewQuote({ jobTitle: "", client: "", clientLocation: "", description: "", validDays: 14, items: [{ desc: "", qty: 1, rate: 0 }], notes: "" })
  }

  const sendQuote = (id: string) => {
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, status: "sent", sentDate: new Date().toISOString().split("T")[0] } : q))
  }

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quotes & Estimates</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage job quotes for your clients</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="rounded-xl"><Plus className="w-4 h-4 mr-2" />New Quote</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Quotes", value: quotes.length, color: "text-foreground" },
          { label: "Accepted", value: quotes.filter(q => q.status === "accepted").length, color: "text-emerald-600" },
          { label: "Pending", value: quotes.filter(q => q.status === "sent").length, color: "text-blue-600" },
          { label: "Win Rate", value: `${Math.round(quotes.filter(q => q.status === "accepted").length / Math.max(quotes.filter(q => q.status !== "draft").length, 1) * 100)}%`, color: "text-primary" },
        ].map((s, i) => (
          <Card key={i} className="p-3 border border-border rounded-xl text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search quotes..." className="pl-9 rounded-xl bg-card border-border" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {["All", "Draft", "Sent", "Accepted", "Rejected"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${filterStatus === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Quote List */}
      <div className="space-y-2">
        {filtered.map(quote => (
          <Card key={quote.id} className="border border-border rounded-xl overflow-hidden">
            <button onClick={() => setExpandedQuote(expandedQuote === quote.id ? null : quote.id)} className="w-full p-4 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><FileText className="w-5 h-5 text-primary" /></div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground truncate">{quote.jobTitle}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColors[quote.status]}`}>{quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{quote.client} - {quote.clientLocation}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 flex items-center gap-3">
                  <p className="text-sm font-bold text-foreground">KES {quote.amount.toLocaleString()}</p>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedQuote === quote.id ? "rotate-180" : ""}`} />
                </div>
              </div>
            </button>
            {expandedQuote === quote.id && (
              <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                <p className="text-xs text-muted-foreground">{quote.description}</p>
                <div className="space-y-1">
                  {quote.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs py-1.5 border-b border-border last:border-0">
                      <span className="text-foreground">{item.desc} (x{item.qty})</span>
                      <span className="font-medium text-foreground">KES {(item.qty * item.rate).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold pt-1"><span className="text-foreground">Total</span><span className="text-foreground">KES {quote.amount.toLocaleString()}</span></div>
                </div>
                {quote.notes && <p className="text-[11px] text-muted-foreground italic bg-muted/30 p-2 rounded-lg">{quote.notes}</p>}
                {quote.status === "draft" && (
                  <Button onClick={() => sendQuote(quote.id)} size="sm" className="rounded-lg"><Send className="w-3 h-3 mr-1" />Send to Client</Button>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Create Quote Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md rounded-xl max-h-[85vh] overflow-y-auto" showCloseButton={false}>
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">Create New Quote</h2>
            <Input value={newQuote.jobTitle} onChange={(e) => setNewQuote(p => ({ ...p, jobTitle: e.target.value }))} placeholder="Job title" className="rounded-lg bg-card border-border" />
            <div className="grid grid-cols-2 gap-3">
              <Input value={newQuote.client} onChange={(e) => setNewQuote(p => ({ ...p, client: e.target.value }))} placeholder="Client name" className="rounded-lg bg-card border-border" />
              <Input value={newQuote.clientLocation} onChange={(e) => setNewQuote(p => ({ ...p, clientLocation: e.target.value }))} placeholder="Location" className="rounded-lg bg-card border-border" />
            </div>
            <Textarea value={newQuote.description} onChange={(e) => setNewQuote(p => ({ ...p, description: e.target.value }))} placeholder="Job description..." className="rounded-lg bg-card border-border min-h-[60px]" />
            <div>
              <div className="flex items-center justify-between mb-2"><label className="text-sm text-muted-foreground">Items</label><button onClick={addItem} className="text-xs text-primary font-medium">+ Add</button></div>
              {newQuote.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <Input value={item.desc} onChange={(e) => setNewQuote(p => ({ ...p, items: p.items.map((it, i) => i === idx ? { ...it, desc: e.target.value } : it) }))} placeholder="Item" className="flex-1 rounded-lg bg-card border-border text-sm" />
                  <Input type="number" value={item.qty} onChange={(e) => setNewQuote(p => ({ ...p, items: p.items.map((it, i) => i === idx ? { ...it, qty: Number(e.target.value) } : it) }))} className="w-14 rounded-lg bg-card border-border text-sm" />
                  <Input type="number" value={item.rate || ""} onChange={(e) => setNewQuote(p => ({ ...p, items: p.items.map((it, i) => i === idx ? { ...it, rate: Number(e.target.value) } : it) }))} placeholder="Rate" className="w-20 rounded-lg bg-card border-border text-sm" />
                </div>
              ))}
            </div>
            <Textarea value={newQuote.notes} onChange={(e) => setNewQuote(p => ({ ...p, notes: e.target.value }))} placeholder="Notes for client..." className="rounded-lg bg-card border-border min-h-[50px]" />
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1 rounded-xl">Cancel</Button>
              <Button onClick={createQuote} disabled={!newQuote.jobTitle.trim() || !newQuote.client.trim()} className="flex-1 rounded-xl">Create Quote</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
