"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search, HelpCircle, MessageCircle, Shield, AlertTriangle, ChevronRight,
  FileText, Phone, Mail, Clock, CheckCircle, Plus, ArrowRight, ChevronDown,
  Wallet, Briefcase, User, Settings
} from "lucide-react"

interface Ticket {
  id: string; subject: string; category: string; status: "open" | "in-progress" | "resolved"
  date: string; lastUpdate: string
}

interface FAQ { question: string; answer: string }

const faqs: FAQ[] = [
  { question: "How do I cancel a booking?", answer: "Go to My Jobs, select the booking you want to cancel, and tap the Cancel button. Cancellations made more than 2 hours before the scheduled time are fully refundable." },
  { question: "How does the 25% downpayment work?", answer: "When you book a service, 25% of the total cost is deducted from your wallet as a downpayment. The remaining 75% is charged upon completion of the service." },
  { question: "What is the emergency service surcharge?", answer: "Emergency bookings include an additional KES 2,000 surcharge on top of the standard service price. This ensures priority dispatch and faster response times." },
  { question: "How do I get a refund?", answer: "Refunds are processed to your SAJI wallet within 24-48 hours. For disputes, file a dispute ticket through this Help Center and our team will review within 72 hours." },
  { question: "How do I verify my account?", answer: "Go to Settings, then tap on Account Verification. You will need to upload a valid government ID and a selfie for identity confirmation." },
  { question: "Can I rebook the same provider?", answer: "Yes! Go to your Favorites page to see your saved providers and use the Rebook button. You can also find them through Find Specialists." },
]

const tickets: Ticket[] = [
  { id: "TKT-001", subject: "Incomplete plumbing work", category: "dispute", status: "in-progress", date: "2 days ago", lastUpdate: "1 hour ago" },
  { id: "TKT-002", subject: "Overcharged for cleaning service", category: "billing", status: "open", date: "Today", lastUpdate: "Just now" },
  { id: "TKT-003", subject: "Provider did not show up", category: "dispute", status: "resolved", date: "1 week ago", lastUpdate: "3 days ago" },
]

const statusColors: Record<string, { bg: string; text: string }> = {
  open: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" },
  "in-progress": { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
  resolved: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400" },
}

const quickLinks = [
  { icon: Briefcase, label: "My Bookings", href: "/customer/jobs", desc: "View and manage your jobs" },
  { icon: Wallet, label: "Wallet", href: "/customer/wallet", desc: "Payments and refunds" },
  { icon: User, label: "Account", href: "/customer/profile", desc: "Profile and verification" },
  { icon: Settings, label: "Settings", href: "/customer/settings", desc: "App preferences" },
]

export function CustomerHelpPage() {
  const [activeView, setActiveView] = useState<"main" | "faq" | "tickets">("main")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [ticketCategory, setTicketCategory] = useState("")
  const [ticketSubject, setTicketSubject] = useState("")
  const [ticketDetails, setTicketDetails] = useState("")
  const [ticketSubmitted, setTicketSubmitted] = useState(false)

  const filteredFaqs = searchQuery
    ? faqs.filter(f => f.question.toLowerCase().includes(searchQuery.toLowerCase()) || f.answer.toLowerCase().includes(searchQuery.toLowerCase()))
    : faqs

  const handleSubmitTicket = () => { setTicketSubmitted(true); setTimeout(() => { setShowNewTicket(false); setTicketSubmitted(false); setTicketCategory(""); setTicketSubject(""); setTicketDetails("") }, 2500) }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-primary" />Help & Support
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Get help, file disputes, or contact support</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-xl border-0 bg-muted/50 text-base"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "main" as const, label: "Overview", icon: HelpCircle },
            { id: "faq" as const, label: "FAQ", icon: FileText },
            { id: "tickets" as const, label: "My Tickets", icon: MessageCircle },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeView === tab.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>

        {/* Main Overview */}
        {activeView === "main" && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => setShowNewTicket(true)}>
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <p className="font-semibold text-sm text-foreground">File a Dispute</p>
                <p className="text-xs text-muted-foreground mt-0.5">Report problems with a service</p>
              </Card>
              <Card className="p-4 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => setActiveView("faq")}>
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="font-semibold text-sm text-foreground">Browse FAQ</p>
                <p className="text-xs text-muted-foreground mt-0.5">Find answers quickly</p>
              </Card>
            </div>

            {/* Contact Support */}
            <Card className="p-5 border-0 shadow-sm">
              <h3 className="font-semibold text-foreground mb-4">Contact Support</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"><MessageCircle className="w-4 h-4 text-emerald-600" /></div>
                  <div className="flex-1 text-left"><p className="text-sm font-medium text-foreground">Live Chat</p><p className="text-xs text-muted-foreground">Chat with support team</p></div>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Online</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><Phone className="w-4 h-4 text-blue-600" /></div>
                  <div className="flex-1 text-left"><p className="text-sm font-medium text-foreground">Call Us</p><p className="text-xs text-muted-foreground">+254 700 SAJI (7254)</p></div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"><Mail className="w-4 h-4 text-amber-600" /></div>
                  <div className="flex-1 text-left"><p className="text-sm font-medium text-foreground">Email</p><p className="text-xs text-muted-foreground">support@saji.co.ke</p></div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </Card>

            {/* Quick Links */}
            <Card className="p-5 border-0 shadow-sm">
              <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
              <div className="grid grid-cols-2 gap-2">
                {quickLinks.map((link, i) => (
                  <a key={i} href={link.href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
                    <link.icon className="w-4 h-4 text-primary" />
                    <div><p className="text-sm font-medium text-foreground">{link.label}</p><p className="text-[11px] text-muted-foreground">{link.desc}</p></div>
                  </a>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* FAQ View */}
        {activeView === "faq" && (
          <div className="space-y-2">
            {filteredFaqs.map((faq, idx) => (
              <Card key={idx} className="border-0 shadow-sm overflow-hidden">
                <button onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)} className="w-full p-4 text-left flex items-center justify-between gap-3">
                  <p className="font-medium text-sm text-foreground">{faq.question}</p>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${expandedFaq === idx ? "rotate-180" : ""}`} />
                </button>
                {expandedFaq === idx && (
                  <div className="px-4 pb-4 -mt-1"><p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p></div>
                )}
              </Card>
            ))}
            {filteredFaqs.length === 0 && (
              <Card className="p-8 text-center border-0 shadow-sm">
                <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium text-foreground">No results found</p>
                <p className="text-sm text-muted-foreground mt-1">Try different keywords or contact support</p>
              </Card>
            )}
          </div>
        )}

        {/* Tickets View */}
        {activeView === "tickets" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{tickets.length} tickets</p>
              <Button size="sm" onClick={() => setShowNewTicket(true)} className="rounded-xl gap-1.5"><Plus className="w-3.5 h-3.5" />New Ticket</Button>
            </div>
            {tickets.map(ticket => {
              const sc = statusColors[ticket.status]
              return (
                <Card key={ticket.id} className="p-4 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-semibold text-sm text-foreground">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{ticket.id} - Filed {ticket.date}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${sc.bg} ${sc.text}`}>{ticket.status.replace("-", " ")}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" /> Last updated {ticket.lastUpdate}
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* New Ticket Dialog */}
        <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
          <DialogContent className="max-w-md rounded-2xl" aria-describedby={undefined}>
            {!ticketSubmitted ? (
              <>
                <DialogHeader><DialogTitle>File a Support Ticket</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div><label className="text-sm font-medium mb-2 block">Category</label>
                    <Select value={ticketCategory} onValueChange={setTicketCategory}><SelectTrigger className="rounded-xl"><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent><SelectItem value="dispute">Service Dispute</SelectItem><SelectItem value="billing">Billing Issue</SelectItem><SelectItem value="account">Account Problem</SelectItem><SelectItem value="safety">Safety Concern</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select>
                  </div>
                  <div><label className="text-sm font-medium mb-2 block">Subject</label><Input value={ticketSubject} onChange={e => setTicketSubject(e.target.value)} placeholder="Brief description" className="rounded-xl" /></div>
                  <div><label className="text-sm font-medium mb-2 block">Details</label><Textarea value={ticketDetails} onChange={e => setTicketDetails(e.target.value)} placeholder="Describe your issue in detail..." className="min-h-[120px] rounded-xl" /></div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowNewTicket(false)} className="flex-1 rounded-xl bg-transparent">Cancel</Button>
                  <Button onClick={handleSubmitTicket} className="flex-1 rounded-xl" disabled={!ticketCategory || !ticketSubject}>Submit</Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-1">Ticket Submitted</h3>
                <p className="text-sm text-muted-foreground">We will respond within 24-48 hours.</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
