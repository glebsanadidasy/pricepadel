import "server-only";
import { cookies } from "next/headers";
import { convert, CURRENCY_COOKIE, DEFAULT_CURRENCY, formatMinor, isCurrency, type CurrencyCode } from "@/config/currency";
import { readSettings } from "./catalog-store";

export async function getCurrency(): Promise<CurrencyCode> {
  const v = (await cookies()).get(CURRENCY_COOKIE)?.value;
  return isCurrency(v) ? v : DEFAULT_CURRENCY;
}

/** 1 GBP in the given currency, from the admin panel's exchange rates. */
export function rateFor(currency: CurrencyCode) {
  return currency === "GBP" ? 1 : readSettings().rates[currency];
}

/** Price formatter for the visitor's currency: takes GBP pence, shows the converted amount. */
export async function getMoney() {
  const currency = await getCurrency();
  const rate = rateFor(currency);
  return { currency, rate, format: (pence: number) => formatMinor(convert(pence, rate), currency) };
}

export const formatGbp = (pence: number) => formatMinor(pence, "GBP");
