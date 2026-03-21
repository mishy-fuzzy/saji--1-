"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

interface PaymentMethod {
  id: string
  name: string
  description: string
  icon: string
  processing_time: string
  fees: string
  available: boolean
}

const paymentMethods: PaymentMethod[] = [
  {
    id: "mpesa",
    name: "M-Pesa",
    description: "Fast and secure mobile payment",
    icon: "📱",
    processing_time: "Instant",
    fees: "Free",
    available: true,
  },
  {
    id: "card",
    name: "Bank Card",
    description: "Visa, Mastercard, or other card",
    icon: "💳",
    processing_time: "1-2 minutes",
    fees: "2.5%",
    available: true,
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "Secure online payment service",
    icon: "🅿️",
    processing_time: "2-5 minutes",
    fees: "1.99% + $0.30",
    available: true,
  },
  {
    id: "bank",
    name: "Bank Transfer",
    description: "Direct bank account transfer",
    icon: "🏦",
    processing_time: "1-3 days",
    fees: "Free",
    available: true,
  },
]

interface PaymentMethodSelectorProps {
  selectedMethod: string
  onSelect: (method: string) => void
}

export function PaymentMethodSelector({ selectedMethod, onSelect }: PaymentMethodSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {paymentMethods.map((method) => (
        <Card
          key={method.id}
          className={`p-6 cursor-pointer transition-all border-2 ${
            selectedMethod === method.id
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 " + (method.available ? "hover:shadow-lg" : "opacity-60")
          } ${!method.available ? "cursor-not-allowed" : ""}`}
          onClick={() => method.available && onSelect(method.id)}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{method.icon}</span>
              <div>
                <h4 className="font-semibold text-foreground">{method.name}</h4>
                <p className="text-xs text-muted-foreground">{method.description}</p>
              </div>
            </div>
            {selectedMethod === method.id && <Check className="w-5 h-5 text-primary flex-shrink-0" />}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs mt-4">
            <div>
              <p className="text-muted-foreground">Processing Time</p>
              <p className="font-semibold text-foreground">{method.processing_time}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Fees</p>
              <p className="font-semibold text-foreground">{method.fees}</p>
            </div>
          </div>

          {!method.available && (
            <Badge className="mt-3 w-full justify-center bg-muted text-muted-foreground">Coming Soon</Badge>
          )}
        </Card>
      ))}
    </div>
  )
}
