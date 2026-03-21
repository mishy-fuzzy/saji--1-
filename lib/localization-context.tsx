"use client"

import { createContext, useState, useEffect, type ReactNode } from "react"
import { translations, type Language } from "@/lib/i18n"
import type { CurrencyCode } from "@/lib/currency"

export interface LocalizationContextType {
  language: Language
  setLanguage: (lang: Language) => void
  currency: CurrencyCode
  setCurrency: (code: CurrencyCode) => void
  theme: "light" | "dark"
  setTheme: (theme: "light" | "dark") => void
  t: (key: string) => string
  convertPrice: (amount: number, fromCurrency?: CurrencyCode, toCurrency?: CurrencyCode) => number
}

export const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined)

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")
  const [currency, setCurrencyState] = useState<CurrencyCode>("KES")
  const [theme, setThemeState] = useState<"light" | "dark">("light")
  const [mounted, setMounted] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const savedLang = (localStorage.getItem("saji-language") as Language) || "en"
    const savedCurrency = (localStorage.getItem("saji-currency") as CurrencyCode) || "KES"
    const savedTheme = (localStorage.getItem("saji-theme") as "light" | "dark") || "light"
    setLanguageState(savedLang)
    setCurrencyState(savedCurrency)
    setThemeState(savedTheme)
    setMounted(true)

    applyTheme(savedTheme)
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("saji-language", lang)
  }

  const setCurrency = (code: CurrencyCode) => {
    setCurrencyState(code)
    localStorage.setItem("saji-currency", code)
  }

  const setTheme = (newTheme: "light" | "dark") => {
    setThemeState(newTheme)
    localStorage.setItem("saji-theme", newTheme)
    applyTheme(newTheme)
  }

  const applyTheme = (themeValue: "light" | "dark") => {
    const html = document.documentElement
    html.classList.toggle("dark", themeValue === "dark")
  }

  // Translation helper
  const t = (key: string): string => {
    const keys = key.split(".")
    let value: any = translations[language]

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k]
      } else {
        return key
      }
    }

    return typeof value === "string" ? value : key
  }

  // Currency conversion helper
  const convertPrice = (
    amount: number,
    fromCurrency: CurrencyCode = "KES",
    toCurrency: CurrencyCode = currency,
  ): number => {
    const rates: Record<CurrencyCode, number> = {
      KES: 1,
      USD: 0.0077,
      EUR: 0.0072,
      GBP: 0.0062,
      TZS: 19.5,
      UGX: 28.5,
      ZAR: 0.14,
    }

    const amountInKES = amount / rates[fromCurrency]
    return Math.round(amountInKES * rates[toCurrency] * 100) / 100
  }

  return (
    <LocalizationContext.Provider
      value={{
        language,
        setLanguage,
        currency,
        setCurrency,
        theme,
        setTheme,
        t,
        convertPrice,
      }}
    >
      {mounted ? children : null}
    </LocalizationContext.Provider>
  )
}
