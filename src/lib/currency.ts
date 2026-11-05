import { cookies } from "next/headers";
import { CURRENCY_COOKIE, DEFAULT_CURRENCY, isCurrency, type CurrencyCode } from "@/config/currency";

export async function getCurrency(): Promise<CurrencyCode> {
  const v = (await cookies()).get(CURRENCY_COOKIE)?.value;
  return isCurrency(v) ? v : DEFAULT_CURRENCY;
}
