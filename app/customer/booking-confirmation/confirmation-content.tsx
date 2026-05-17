"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { useLocalization } from "@/lib/hooks/useLocalization"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, Clock, DollarSign, MessageCircle, Phone } from "lucide-react"

type BookingPayload = {
  id: string
  amount: number
  currency: string
  createdAt: string
  customer?: { name?: string; phone?: string; email?: string }
  provider?: { name?: string; phone?: string }
  service?: { name?: string }
}

export default function BookingConfirmationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currency: localeCurrency } = useLocalization()

  const bookingId = searchParams.get("bookingId")
  const [booking, setBooking] = useState<BookingPayload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function fetchBooking(id: string) {
      try {
        setLoading(true)
        const res = await fetch(`/api/bookings/${encodeURIComponent(id)}`)
        const payload = await res.json()
        if (payload?.ok && mounted) {
          setBooking(payload.data)
        }
      } catch (err) {
        // ignore - keep UI graceful
      } finally {
        if (mounted) setLoading(false)
      }
    }

    if (bookingId) fetchBooking(bookingId)
    return () => { mounted = false }
  }, [bookingId])

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full py-6 space-y-6">
        <Card className="p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-green-600" />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Booking Created</h1>
            <p className="text-muted-foreground">We created your booking. Payment may still be pending.</p>
          </div>

          <Card className="bg-muted p-6 space-y-4 border-0">
            <div className="text-left">
              <p className="text-sm text-muted-foreground mb-1">Booking Reference</p>
              <p className="text-2xl font-bold text-foreground">{booking?.id || bookingId || "-"}</p>
            </div>

            <hr className="border-border" />

            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-semibold text-foreground">{booking ? new Date(booking.createdAt).toLocaleString() : "-"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-semibold text-foreground text-lg">{booking ? `${booking.currency} ${booking.amount}` : `${localeCurrency} -`}</p>
                </div>
              </div>
            </div>

            <hr className="border-border" />

            <div className="text-left">
              <p className="text-sm text-muted-foreground mb-2">Provider Information</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="font-bold text-primary">{booking?.provider?.name?.[0] || "P"}</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{booking?.provider?.name || "Provider"}</p>
                  <p className="text-xs text-muted-foreground">{booking?.provider?.phone || booking?.provider?.email || ""}</p>
                </div>
              </div>
            </div>
          </Card>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700 font-medium">
              {loading ? "Loading booking details..." : "Your provider has been notified. Payment status may still be pending."}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={() => router.push("/customer/home")}>
                Back to Home
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => router.push("/customer/jobs")}>
                View My Jobs
              </Button>
            </div>

            <div className="flex gap-2 text-sm">
              <Button variant="ghost" size="sm" className="flex-1 flex items-center justify-center gap-2">
                <Phone className="w-4 h-4" />
                Call Provider
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 flex items-center justify-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Message Provider
              </Button>
            </div>
          </div>

          <Card className="p-4 border-l-4 border-l-primary bg-blue-50">
            <h3 className="font-semibold text-foreground mb-2">What's Next?</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ Provider will contact you shortly</li>
              <li>✓ We will notify you when payment is confirmed</li>
              <li>✓ You can track the job in the Jobs area</li>
              <li>✓ Leave feedback after service completion</li>
            </ul>
          </Card>
        </Card>
      </div>
    </div>
  )
}
