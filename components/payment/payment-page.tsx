"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { useLocalization } from "@/lib/hooks/useLocalization"
import { formatCurrency, convertCurrency, currencies, type CurrencyCode } from "@/lib/currency"
import { PaymentMethodSelector } from "./payment-method-selector"
import { CurrencySelector } from "./currency-selector"
import { PriceBreakdown } from "./price-breakdown"
import { PaymentForm } from "./payment-form"
import { ShieldCheck } from "lucide-react"

import { useSearchParams } from "next/navigation"
import { useAuthContext } from "@/lib/auth-context"

export function PaymentPage() {
  const { t, currency, setCurrency } = useLocalization()
  const { user } = useAuthContext()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("mpesa")
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(currency as CurrencyCode)
  const [paymentStep, setPaymentStep] = useState<"method" | "details">("method")
  const [bookingId, setBookingId] = useState<string | null>(null)

  const serviceId = searchParams.get("serviceId")
  const providerId = searchParams.get("providerId")
  const customerId = searchParams.get("customerId") || user?.id || ""
  const basePrice = Number(searchParams.get("price")) || 5000 // KES
  const locationModifier = 1.0 // No location modifier for now
  const servicePrice = basePrice * locationModifier

  // Convert to selected currency
  const kesRate = currencies.KES.rate
  const selectedRate = currencies[selectedCurrency].rate
  const convertedPrice = convertCurrency(servicePrice, kesRate, selectedRate)

  const handlePaymentMethodSelect = async (method: string) => {
    setSelectedPaymentMethod(method)

    if (!bookingId && serviceId && providerId && customerId) {
      try {
        const response = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId,
            providerId,
            serviceId,
            amount: Math.round(servicePrice),
            currency: "KES",
          }),
        })
        const payload = await response.json()
        if (payload.ok) {
          setBookingId(payload.data.id)
        }
      } catch (error) {
        console.error("Failed to pre-create booking", error)
      }
    }
    
    setPaymentStep("details")
  }

  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    setSelectedCurrency(newCurrency)
    setCurrency(newCurrency)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Secure Payment</h1>
        <p className="text-muted-foreground">Complete your booking with our secure payment system</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs value={paymentStep} onValueChange={(v) => setPaymentStep(v as any)} className="space-y-6">
            {/* Step 1: Payment Method */}
            <TabsContent value="method" className="space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold text-foreground text-lg mb-6">{t("payment.selectMethod")}</h3>
                <PaymentMethodSelector selectedMethod={selectedPaymentMethod} onSelect={handlePaymentMethodSelect} />
              </Card>
            </TabsContent>

            {/* Step 2: Payment Details */}
            <TabsContent value="details" className="space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold text-foreground text-lg mb-6">Enter Payment Details</h3>
                <PaymentForm
                  paymentMethod={selectedPaymentMethod}
                  amountKES={Math.round(servicePrice)}
                  accountReference={bookingId ? `BO-${bookingId.slice(-6).toUpperCase()}` : "SAJI-BOOKING"}
                  bookingId={bookingId || undefined}
                  onSubmit={() => {
                    if (bookingId) {
                      router.push(`/customer/booking-confirmation?bookingId=${encodeURIComponent(bookingId)}`)
                      return
                    }
                    setPaymentStep("method")
                  }}
                />
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Currency Selector */}
          <CurrencySelector selectedCurrency={selectedCurrency} onSelect={handleCurrencyChange} />

          {/* Price Breakdown */}
          <PriceBreakdown
            basePrice={servicePrice}
            convertedPrice={convertedPrice}
            selectedCurrency={selectedCurrency}
          />

          {/* Trust Badge */}
          <Card className="p-6 text-center space-y-3">
            <ShieldCheck className="w-12 h-12 text-primary mx-auto" />
            <h4 className="font-semibold text-foreground">Secure & Trusted</h4>
            <p className="text-sm text-muted-foreground">PCI DSS Compliant Payment Processing</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
