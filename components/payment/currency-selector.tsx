"use client"

import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { currencies, type CurrencyCode } from "@/lib/currency"
import { Globe } from "lucide-react"

interface CurrencySelectorProps {
  selectedCurrency: CurrencyCode
  onSelect: (currency: CurrencyCode) => void
}

export function CurrencySelector({ selectedCurrency, onSelect }: CurrencySelectorProps) {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Globe className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Currency</h3>
      </div>

      <Select value={selectedCurrency} onValueChange={(value) => onSelect(value as CurrencyCode)}>
        <SelectTrigger className="h-11 rounded-lg border-2 border-border focus:border-primary">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(currencies).map(([code, data]) => (
            <SelectItem key={code} value={code}>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{data.symbol}</span>
                <span>{code}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <p className="text-xs text-muted-foreground">Prices will be automatically converted to your selected currency</p>
    </Card>
  )
}
