"use client"

import { Card } from "@/components/ui/card"
import { formatCurrency, type CurrencyCode } from "@/lib/currency"

interface PriceBreakdownProps {
  basePrice: number
  convertedPrice: number
  selectedCurrency: CurrencyCode
}

export function PriceBreakdown({ basePrice, convertedPrice, selectedCurrency }: PriceBreakdownProps) {
  const commission = convertedPrice * 0.1 // 10% commission for skilled service
  const subtotal = convertedPrice
  const platformFee = subtotal * 0.02 // 2% platform fee
  const total = subtotal + platformFee

  return (
    <Card className="p-6 space-y-4">
      <h3 className="font-semibold text-foreground">Price Breakdown</h3>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Service Price</span>
          <span className="font-semibold text-foreground">{formatCurrency(subtotal, selectedCurrency)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Platform Fee (2%)</span>
          <span className="font-semibold text-foreground">+{formatCurrency(platformFee, selectedCurrency)}</span>
        </div>

        <div className="border-t border-border pt-3 flex justify-between">
          <span className="font-semibold text-foreground">Total Amount</span>
          <span className="text-xl font-bold text-primary">{formatCurrency(total, selectedCurrency)}</span>
        </div>
      </div>

      <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg text-xs text-green-800 dark:text-green-200">
        This includes SAJI's commission which goes directly to the service provider
      </div>
    </Card>
  )
}
