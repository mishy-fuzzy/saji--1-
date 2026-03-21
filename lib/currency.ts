export const currencies = {
  KES: { name: "Kenyan Shilling", symbol: "KES", code: "KES", rate: 1 },
  USD: { name: "US Dollar", symbol: "$", code: "USD", rate: 0.0077 },
  EUR: { name: "Euro", symbol: "€", code: "EUR", rate: 0.0072 },
  GBP: { name: "British Pound", symbol: "£", code: "GBP", rate: 0.0061 },
  TZS: { name: "Tanzanian Shilling", symbol: "TZS", code: "TZS", rate: 19.5 },
  UGX: { name: "Ugandan Shilling", symbol: "UGX", code: "UGX", rate: 28.5 },
  ZAR: { name: "South African Rand", symbol: "R", code: "ZAR", rate: 0.13 },
} as const

export type CurrencyCode = keyof typeof currencies

export const locationToCurrency: Record<string, CurrencyCode> = {
  KE: "KES",
  TZ: "TZS",
  UG: "UGX",
  ZA: "ZAR",
  US: "USD",
  GB: "GBP",
  EU: "EUR",
}

export function convertCurrency(amount: number, fromRate: number, toRate: number): number {
  return (amount / fromRate) * toRate
}

export function formatCurrency(amount: number, currency: CurrencyCode = "KES"): string {
  const currencyData = currencies[currency]
  return `${currencyData.symbol} ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
