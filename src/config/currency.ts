export const CURRENCIES = {
  GBP: { code: "GBP", symbol: "£", label: "Pound sterling (£)", flag: "gb", locale: "en-GB" },
  EUR: { code: "EUR", symbol: "€", label: "Euro (€)", flag: "eu", locale: "en-IE" },
  USD: { code: "USD", symbol: "$", label: "US dollar ($)", flag: "us", locale: "en-US" },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;
export const DEFAULT_CURRENCY: CurrencyCode = "GBP";
export const CURRENCY_COOKIE = "currency";

export function isCurrency(v: unknown): v is CurrencyCode {
  return typeof v === "string" && v in CURRENCIES;
}

/** Converts a GBP amount (pence) to the currency's minor units with the given rate (1 GBP = rate). */
export function convert(pence: number, rate: number) {
  return Math.round(pence * rate);
}

/** Formats an amount already in the currency's minor units. */
export function formatMinor(minor: number, currency: CurrencyCode) {
  const c = CURRENCIES[currency];
  return new Intl.NumberFormat(c.locale, { style: "currency", currency: c.code }).format(minor / 100);
}
