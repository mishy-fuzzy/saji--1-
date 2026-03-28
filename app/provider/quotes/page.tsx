"use client"

import { useEffect, useMemo, useState } from "react"
import { FileText, Send, Plus, Search, ChevronDown } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useAuthContext } from "@/lib/auth-context"

type Quote = {
  id: string
  jobTitle: string
  client: string
  clientLocation: string
  description: string
  amount: number
  validDays: number
  status: "draft" | "sent" | "accepted" | "rejected" | "expired"
  sentDate: string
  items: { desc: string; qty: number; rate: number }[]
  notes: string
  bookingId?: string
}

export default function QuotesPage() {
  const { user } = useAuthContext()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [filterStatus, setFilterStatus] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedQuote, setExpandedQuote] = useState<string | null>(null)
  const [newQuote, setNewQuote] = useState({
    bookingId: "",
    validDays: 14,
    items: [{ desc: "", qty: 1, rate: 0 }],
    notes: "",
  })

  useEffect(() => {
    if (!user?.id) return

    const loadQuotes = async () => {
      try {
        const [bidsRes, bookingsRes] = await Promise.all([
          fetch(`/api/bids?providerId=${encodeURIComponent(user.id)}`, { cache: "no-store" }),
          fetch(`/api/bookings?providerId=${encodeURIComponent(user.id)}`, { cache: "no-store" }),
        ])

        const bidsPayload = await bidsRes.json()
        const bookingsPayload = await bookingsRes.json()
        const bidRows = Array.isArray(bidsPayload?.data) ? bidsPayload.data : []
        const bookingRows = Array.isArray(bookingsPayload?.data) ? bookingsPayload.data : []

        setBookings(bookingRows)
        setQuotes(
          bidRows.map((row: any) => ({
            id: String(row.id),
            bookingId: String(row.bookingId || ""),
            jobTitle: String(row?.booking?.service?.name || "Service Quote"),
            client: String(row?.booking?.customer?.name || "Client"),
            clientLocation: "Kenya",
            description: String(row?.note || "Service quote"),
            amount: Number(row?.amount || 0),
            validDays: 14,
            status: String(row?.status || "draft") as Quote["status"],
            sentDate: row?.createdAt ? String(row.createdAt).slice(0, 10) : "",
            items: [
              {
                desc: String(row?.booking?.service?.name || "Service"),
                qty: 1,
                rate: Number(row?.amount || 0),
              },
            ],
            notes: String(row?.note || ""),
          })),
        )
      } catch {
        setQuotes([])
        setBookings([])
      }
    }

    loadQuotes()
    const intervalId = window.setInterval(loadQuotes, 20000)
    return () => window.clearInterval(intervalId)
  }, [user?.id])

  const bookingOptions = useMemo(() => {
    return bookings.map((row: any) => ({
      id: String(row.id),
      label: `${String(row?.service?.name || "Service")} - ${String(row?.customer?.name || "Client")}`,
      amount: Number(row?.amount || 0),
    }))
  }, [bookings])

  const filtered = useMemo(() => {
    return quotes
      .filter((q) => filterStatus === "All" || q.status === filterStatus.toLowerCase())
      .filter(
        (q) =>
          q.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()),
      )
  }, [quotes, filterStatus, searchQuery])

  const statusColors: Record<string, string> = {
    accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    expired: "bg-muted text-muted-foreground",
    draft: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    pending: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  }

  const addItem = () =>
    setNewQuote((prev) => ({
      ...prev,
      items: [...prev.items, { desc: "", qty: 1, rate: 0 }],
    }))

  const createQuote = async () => {
    if (!user?.id || !newQuote.bookingId) return

    const amount = newQuote.items.reduce((sum, item) => sum + item.qty * item.rate, 0)

    try {
      const response = await fetch("/api/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: user.id,
          bookingId: newQuote.bookingId,
          amount: Math.max(1, Math.round(amount)),
          currency: "KES",
          note: newQuote.notes,
        }),
      })
      const payload = await response.json()
      if (!response.ok || !payload?.ok || !payload?.data) throw new Error(payload?.error || "Failed to create quote")

      const selectedBooking = bookings.find((row: any) => String(row.id) === newQuote.bookingId)
      const row = payload.data

      setQuotes((prev) => [
        {
          id: String(row.id),
          bookingId: String(row.bookingId || ""),
          jobTitle: String(selectedBooking?.service?.name || "Service Quote"),
          client: String(selectedBooking?.customer?.name || "Client"),
          clientLocation: "Kenya",
          description: String(newQuote.notes || "Service quote"),
          amount: Number(row.amount || 0),
          validDays: Number(newQuote.validDays || 14),
          status: "draft",
          sentDate: row?.createdAt ? String(row.createdAt).slice(0, 10) : "",
          items: newQuote.items,
          notes: String(newQuote.notes || ""),
        },
        ...prev,
      ])

      setShowCreate(false)
      setNewQuote({ bookingId: "", validDays: 14, items: [{ desc: "", qty: 1, rate: 0 }], notes: "" })
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create quote")
    }
  }

  const sendQuote = async (id: string) => {
    try {
      const response = await fetch("/api/bids", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bidId: id, status: "sent" }),
      })
      const payload = await response.json()
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Failed to send quote")

      setQuotes((prev) =>
        prev.map((quote) =>
          quote.id === id
            ? { ...quote, status: "sent", sentDate: new Date().toISOString().slice(0, 10) }
            : quote,
        ),
      )
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to send quote")
    }
  }

  const nonDraft = quotes.filter((quote) => quote.status !== "draft")

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quotes & Estimates</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage job quotes for your clients</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="rounded-xl"><Plus className="w-4 h-4 mr-2" />New Quote</Button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Quotes", value: quotes.length, color: "text-foreground" },
          { label: "Accepted", value: quotes.filter((q) => q.status === "accepted").length, color: "text-emerald-600" },
          { label: "Pending", value: quotes.filter((q) => q.status === "sent" || q.status === "pending").length, color: "text-blue-600" },
          {
            label: "Win Rate",
            value: `${Math.round((quotes.filter((q) => q.status === "accepted").length / Math.max(nonDraft.length, 1)) * 100)}%`,
            color: "text-primary",
          },
        ].map((stat, index) => (
          <Card key={index} className="p-3 border border-border rounded-xl text-center">
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search quotes..." className="pl-9 rounded-xl bg-card border-border" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {["All", "Draft", "Sent", "Accepted", "Rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                filterStatus === status ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((quote) => (
          <Card key={quote.id} className="border border-border rounded-xl overflow-hidden">
            <button onClick={() => setExpandedQuote(expandedQuote === quote.id ? null : quote.id)} className="w-full p-4 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><FileText className="w-5 h-5 text-primary" /></div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground truncate">{quote.jobTitle}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColors[quote.status] || statusColors.draft}`}>
                        {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{quote.client} - {quote.clientLocation}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 flex items-center gap-3">
                  <p className="text-sm font-bold text-foreground">KES {quote.amount.toLocaleString()}</p>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedQuote === quote.id ? "rotate-180" : ""}`} />
                </div>
              </div>
            </button>
            {expandedQuote === quote.id && (
              <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                <p className="text-xs text-muted-foreground">{quote.description}</p>
                <div className="space-y-1">
                  {quote.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-xs py-1.5 border-b border-border last:border-0">
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
        {filtered.length === 0 && <Card className="p-6 text-center text-sm text-muted-foreground">No quotes available.</Card>}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md rounded-xl max-h-[85vh] overflow-y-auto" showCloseButton={false}>
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">Create New Quote</h2>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Booking</label>
              <select
                value={newQuote.bookingId}
                onChange={(e) => {
                  const bookingId = e.target.value
                  const booking = bookingOptions.find((option) => option.id === bookingId)
                  setNewQuote((prev) => ({
                    ...prev,
                    bookingId,
                    items: booking
                      ? [{ desc: booking.label, qty: 1, rate: Number(booking.amount || 0) }]
                      : prev.items,
                  }))
                }}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <option value="">Select booking</option>
                {bookingOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2"><label className="text-sm text-muted-foreground">Items</label><button onClick={addItem} className="text-xs text-primary font-medium">+ Add</button></div>
              {newQuote.items.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input value={item.desc} onChange={(e) => setNewQuote((prev) => ({ ...prev, items: prev.items.map((row, i) => i === index ? { ...row, desc: e.target.value } : row) }))} placeholder="Item" className="flex-1 rounded-lg bg-card border-border text-sm" />
                  <Input type="number" value={item.qty} onChange={(e) => setNewQuote((prev) => ({ ...prev, items: prev.items.map((row, i) => i === index ? { ...row, qty: Number(e.target.value || 0) } : row) }))} className="w-14 rounded-lg bg-card border-border text-sm" />
                  <Input type="number" value={item.rate || ""} onChange={(e) => setNewQuote((prev) => ({ ...prev, items: prev.items.map((row, i) => i === index ? { ...row, rate: Number(e.target.value || 0) } : row) }))} placeholder="Rate" className="w-20 rounded-lg bg-card border-border text-sm" />
                </div>
              ))}
            </div>

            <Textarea value={newQuote.notes} onChange={(e) => setNewQuote((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Notes for client..." className="rounded-lg bg-card border-border min-h-[50px]" />

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1 rounded-xl">Cancel</Button>
              <Button onClick={createQuote} disabled={!newQuote.bookingId} className="flex-1 rounded-xl">Create Quote</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
