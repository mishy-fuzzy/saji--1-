"use client";

import { useContext } from "react";
import { LocalizationContext } from "@/lib/localization-context";
import type { CurrencyCode } from "@/lib/currency";

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error("useLocalization must be used within LocalizationProvider");
  }

  // Backward-compatible guard for stale deployments where formatCurrency
  // may be absent in the provider value.
  if (
    typeof (context as { formatCurrency?: unknown }).formatCurrency !==
    "function"
  ) {
    const fallback = (amount: number, code?: CurrencyCode) => {
      const target = code ?? context.currency;
      const converted = context.convertPrice(
        Number.isFinite(amount) ? amount : 0,
        "KES",
        target,
      );

      try {
        return new Intl.NumberFormat("en-KE", {
          style: "currency",
          currency: target,
          maximumFractionDigits: 2,
        }).format(converted);
      } catch {
        return `${target} ${converted.toLocaleString()}`;
      }
    };

    return {
      ...context,
      formatCurrency: fallback,
    };
  }

  return context;
}
