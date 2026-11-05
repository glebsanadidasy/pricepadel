export const CURRENCIES = {
  GBP: { code: "GBP", symbol: "£", label: "Pound sterling (£)", flag: "gb", locale: "en-GB" },
  EUR: { code: "EUR", symbol: "€", label: "Euro (€)", flag: "eu", locale: "en-IE" },
  USD: { code: "USD", symbol: "$", label: "US dollar ($)", flag: "us", locale: "en-US" },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;
export const DEFAULT_CURRENCY: CurrencyCode = "GBP";
export const CURRENCY_COOKIE = "currency";

/**
 * PREVIEW ONLY. Prices are kept in GBP; EUR and USD are shown with these fixed placeholder rates
 * until the owner decides how foreign-currency prices are set (fixed price lists or a daily rate).
 */
export const PREVIEW_RATES: Record<CurrencyCode, number> = { GBP: 1, EUR: 1.15, USD: 1.3 };

export function isCurrency(v: unknown): v is CurrencyCode {
  return typeof v === "string" && v in CURRENCIES;
}

/** `pence` is the GBP price in pence. */
export function formatPrice(pence: number, currency: CurrencyCode) {
  const c = CURRENCIES[currency];
  const amount = Math.round(pence * PREVIEW_RATES[currency]) / 100;
  return new Intl.NumberFormat(c.locale, { style: "currency", currency: c.code }).format(amount);
}
