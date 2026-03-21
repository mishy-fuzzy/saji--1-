"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useAuthContext } from "@/lib/auth-context"
import { useLocalization } from "@/lib/hooks/useLocalization"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, Clock, MapPin, DollarSign, MessageCircle, Phone } from "lucide-react"

export default function BookingConfirmationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currency } = useLocalization()
  const { user } = useAuthContext()

  const bookingId = searchParams.get("bookingId")

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full py-6 space-y-6">
        {/* Success Card */}
        <Card className="p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-green-600" />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Booking Confirmed!</h1>
            <p className="text-muted-foreground">Your service booking has been confirmed successfully</p>
          </div>

          {/* Booking Details */}
          <Card className="bg-muted p-6 space-y-4 border-0">
            <div className="text-left">
              <p className="text-sm text-muted-foreground mb-1">Booking Reference</p>
              <p className="text-2xl font-bold text-foreground">{bookingId}</p>
            </div>

            <hr className="border-border" />

            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-semibold text-foreground">Today at 2:00 PM - 5:00 PM</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-semibold text-foreground">123 Main Street, Nairobi</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Cost</p>
                  <p className="font-semibold text-foreground text-lg">{currency} 16,500</p>
                </div>
              </div>
            </div>

            <hr className="border-border" />

            <div className="text-left">
              <p className="text-sm text-muted-foreground mb-2">Provider Information</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="font-bold text-primary">M</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Mike T.</p>
                  <p className="text-xs text-muted-foreground">⭐ 4.9 (128 reviews)</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Status Indicator */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700 font-medium">
              ✓ Your provider has been notified and will contact you shortly
            </p>
          </div>

          {/* Action Buttons */}
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

          {/* Service Instructions */}
          <Card className="p-4 border-l-4 border-l-primary bg-blue-50">
            <h3 className="font-semibold text-foreground mb-2">What's Next?</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ Provider will contact you within 5 minutes</li>
              <li>✓ Payment will be collected on the day of service</li>
              <li>✓ You can track the job in real-time</li>
              <li>✓ Leave feedback after service completion</li>
            </ul>
          </Card>
        </Card>
      </div>
    </div>
  )
}
