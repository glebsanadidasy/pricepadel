import "server-only";
import { cookies } from "next/headers";
import { convert, CURRENCY_COOKIE, DEFAULT_CURRENCY, formatMinor, isCurrency, type CurrencyCode } from "@/config/currency";
import { readSettings } from "./catalog-store";
import { enabledCurrencies, maybeRefreshRates, rateInfo } from "./fx";

/** The visitor's currency; a currency that is switched off (no fresh rate) falls back to GBP. */
export async function getCurrency(): Promise<CurrencyCode> {
  maybeRefreshRates();
  const v = (await cookies()).get(CURRENCY_COOKIE)?.value;
  const enabled = enabledCurrencies();
  return isCurrency(v) && enabled.includes(v) ? v : (enabled[0] ?? DEFAULT_CURRENCY);
}

/** 1 GBP in the given currency (ECB + margin, or the manual rate from the admin panel). */
export function rateFor(currency: CurrencyCode) {
  if (currency === "GBP") return 1;
  return rateInfo(currency, readSettings().fx).rate ?? 1;
}

/** Price formatter for the visitor's currency: takes GBP pence, shows the converted amount. */
export async function getMoney() {
  const currency = await getCurrency();
  const rate = rateFor(currency);
  return { currency, rate, format: (pence: number) => formatMinor(convert(pence, rate), currency) };
}

export const formatGbp = (pence: number) => formatMinor(pence, "GBP");
