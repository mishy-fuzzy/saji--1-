"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLocalization } from "@/lib/hooks/useLocalization"
import { currencies, type CurrencyCode } from "@/lib/currency"
import { Check, DollarSign } from "lucide-react"

const currencyOptions = [
  { code: "KES", region: "Kenya", icon: "🇰🇪" },
  { code: "USD", region: "United States", icon: "🇺🇸" },
  { code: "EUR", region: "Europe", icon: "🇪🇺" },
  { code: "GBP", region: "United Kingdom", icon: "🇬🇧" },
  { code: "TZS", region: "Tanzania", icon: "🇹🇿" },
  { code: "UGX", region: "Uganda", icon: "🇺🇬" },
  { code: "ZAR", region: "South Africa", icon: "🇿🇦" },
]

export function CurrencySettings() {
  const { currency, setCurrency } = useLocalization()

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Currency
        </h3>
        <p className="text-sm text-muted-foreground">Select your preferred currency for pricing and payments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currencyOptions.map((option) => {
          const currencyData = currencies[option.code as CurrencyCode]

          return (
            <div
              key={option.code}
              onClick={() => setCurrency(option.code as CurrencyCode)}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                currency === option.code
                  ? "border-primary bg-primary/5 shadow-lg"
                  : "border-border hover:border-primary/50 hover:shadow-md"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{option.icon}</span>
                  <div>
                    <p className="font-semibold text-foreground">{option.code}</p>
                    <p className="text-xs text-muted-foreground">{currencyData.symbol}</p>
                  </div>
                </div>
                {currency === option.code && <Check className="w-5 h-5 text-primary" />}
              </div>

              <p className="text-sm text-muted-foreground">{option.region}</p>
            </div>
          )
        })}
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-200">
        All prices on SAJI will be automatically converted to your selected currency at current market rates.
      </div>

      <Button className="rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold">
        Save Currency
      </Button>
    </Card>
  )
}
