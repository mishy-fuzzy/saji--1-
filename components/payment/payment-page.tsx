"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { useLocalization } from "@/lib/hooks/useLocalization"
import { formatCurrency, convertCurrency, currencies, type CurrencyCode } from "@/lib/currency"
import { PaymentMethodSelector } from "./payment-method-selector"
import { CurrencySelector } from "./currency-selector"
import { PriceBreakdown } from "./price-breakdown"
import { PaymentForm } from "./payment-form"
import { ShieldCheck, Zap, RotateCcw } from "lucide-react"

export function PaymentPage() {
  const { t, currency, setCurrency } = useLocalization()
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("mpesa")
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(currency as CurrencyCode)
  const [paymentStep, setPaymentStep] = useState<"method" | "details" | "confirmation">("method")

  const basePrice = 5000 // KES
  const locationModifier = 1.0 // No location modifier for now
  const servicePrice = basePrice * locationModifier

  // Convert to selected currency
  const kesRate = currencies.KES.rate
  const selectedRate = currencies[selectedCurrency].rate
  const convertedPrice = convertCurrency(servicePrice, kesRate, selectedRate)

  const handlePaymentMethodSelect = (method: string) => {
    setSelectedPaymentMethod(method)
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
                  accountReference="SAJI-BOOKING"
                  onSubmit={() => setPaymentStep("confirmation")}
                />
              </Card>
            </TabsContent>

            {/* Step 3: Confirmation */}
            <TabsContent value="confirmation" className="space-y-6">
              <Card className="p-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-foreground text-lg mb-4">Review Your Payment</h3>
                  <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service</span>
                      <span className="font-semibold text-foreground">Professional Electrical Installation</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Method</span>
                      <span className="font-semibold text-foreground capitalize">{selectedPaymentMethod}</span>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between">
                      <span className="font-semibold text-foreground">Total Amount</span>
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(convertedPrice, selectedCurrency)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { icon: ShieldCheck, text: "Your payment is secure and encrypted" },
                    { icon: Zap, text: "Instant confirmation after payment" },
                    { icon: RotateCcw, text: "30-day money-back guarantee" },
                  ].map((item, idx) => {
                    const Icon = item.icon
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{item.text}</span>
                      </div>
                    )
                  })}
                </div>

                <Button
                  onClick={() => alert("Payment processed!")}
                  className="w-full h-12 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold"
                >
                  Confirm & Pay {formatCurrency(convertedPrice, selectedCurrency)}
                </Button>
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
