import "server-only";
import { readSettings, writeSettings, type FxSettings } from "./catalog-store";

/**
 * Exchange rates for showing and charging EUR / USD. Prices are kept in GBP.
 * - Once a day the public ECB euro reference rates are read (no key, no account) and stored in settings.fx.
 * - Shown rate = ECB cross rate × (1 + margin %), margin set in the admin panel (default 2 %).
 * - A manual rate from the admin panel replaces the ECB rate.
 * - A rate older than 3 days switches that currency off (prices fall back to GBP) and the admin panel warns.
 * The customer is charged exactly the amount shown: the order stores the rate it was priced with.
 */
export type FxCode = "EUR" | "USD";

export const FX_CODES: FxCode[] = ["EUR", "USD"];
const ECB_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";
const MAX_AGE_MS = 3 * 24 * 3600 * 1000;
const REFRESH_MS = 24 * 3600 * 1000;
const RETRY_MS = 3600 * 1000;


export type RateInfo = { rate: number | null; source: "manual" | "ecb" | null; date: string | null; enabled: boolean; problem: string | null };

/** The rate used for a currency right now, and whether the currency is on. */
export function rateInfo(code: FxCode, fx: FxSettings, now = Date.now()): RateInfo {
  const e = fx[code];
  const pick =
    e.manual && e.manualAt
      ? { rate: e.manual, source: "manual" as const, date: e.manualAt }
      : e.ecb && e.ecbDate
        ? { rate: Math.round(e.ecb * (1 + fx.marginPct / 100) * 10000) / 10000, source: "ecb" as const, date: e.ecbDate }
        : null;
  if (!pick) return { rate: null, source: null, date: null, enabled: false, problem: "no rate yet" };
  const age = now - Date.parse(pick.date);
  if (!(age <= MAX_AGE_MS)) return { ...pick, enabled: false, problem: `rate is older than 3 days (${pick.date.slice(0, 10)})` };
  return { ...pick, enabled: true, problem: null };
}

export function enabledCurrencies(): ("GBP" | FxCode)[] {
  const fx = readSettings().fx;
  return ["GBP", ...FX_CODES.filter((c) => rateInfo(c, fx).enabled)];
}

/** Parses the ECB daily XML into GBP→EUR and GBP→USD cross rates. */
export function parseEcb(xml: string) {
  const date = xml.match(/time=['"](\d{4}-\d{2}-\d{2})['"]/)?.[1];
  const rate = (cur: string) => Number(xml.match(new RegExp(`currency=['"]${cur}['"]\\s+rate=['"]([\\d.]+)['"]`))?.[1]);
  const gbp = rate("GBP");
  const usd = rate("USD");
  if (!date || !(gbp > 0) || !(usd > 0)) throw new Error("Unexpected ECB file");
  return { date, EUR: Math.round((1 / gbp) * 1e6) / 1e6, USD: Math.round((usd / gbp) * 1e6) / 1e6 };
}

export async function refreshFromEcb() {
  const res = await fetch(ECB_URL, { signal: AbortSignal.timeout(15000), headers: { "User-Agent": "PricePadel/1.0 (+contact@pricepadel.com)" } });
  if (!res.ok) throw new Error(`ECB answered HTTP ${res.status}`);
  const r = parseEcb(await res.text());
  const s = structuredClone(readSettings());
  const fx = s.fx;
  // ECB rates are published around 16:00 CET for that day.
  const at = `${r.date}T15:00:00.000Z`;
  fx.EUR = { ...fx.EUR, ecb: r.EUR, ecbDate: at };
  fx.USD = { ...fx.USD, ecb: r.USD, ecbDate: at };
  fx.fetchedAt = new Date().toISOString();
  fx.lastError = null;
  writeSettings(s);
  return r;
}

/** Daily refresh, started in the background by page requests (never makes a visitor wait). FX_AUTO=0 turns it off. */
const g = globalThis as unknown as { __ppFxBusy?: boolean; __ppFxTriedAt?: number };
export function maybeRefreshRates() {
  if (process.env.FX_AUTO === "0" || g.__ppFxBusy) return;
  const fx = readSettings().fx;
  const last = fx.fetchedAt ? Date.parse(fx.fetchedAt) : 0;
  if (Date.now() - last < REFRESH_MS || Date.now() - (g.__ppFxTriedAt ?? 0) < RETRY_MS) return;
  g.__ppFxBusy = true;
  g.__ppFxTriedAt = Date.now();
  refreshFromEcb()
    .catch((e: Error) => {
      const s = structuredClone(readSettings());
      s.fx.lastError = `${new Date().toISOString()}: ${e.message}`;
      writeSettings(s);
    })
    .finally(() => {
      g.__ppFxBusy = false;
    });
}
