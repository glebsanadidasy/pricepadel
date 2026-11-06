/**
 * Card gateway settings (hosted payment page, redirect flow), read only from the environment (.env):
 *   PAYMENT_API_BASE_URL, PAYMENT_API_TOKEN, PAYMENT_WEBHOOK_SECRET, PAYMENT_ACCOUNT_ID, PAYMENT_MODE=test|live, PAYMENT_LIVE_ENABLED
 * Pure function (no server imports) so the rules can be tested on their own.
 */
export type GatewayConfig =
  | { ok: true; baseUrl: string; token: string; secret: string; accountId: string; mode: "test" | "live" }
  | { ok: false; reason: string };

type Env = Record<string, string | undefined>;

export function gatewayConfig(env: Env): GatewayConfig {
  const baseUrl = (env.PAYMENT_API_BASE_URL ?? "").trim().replace(/\/+$/, "");
  const token = (env.PAYMENT_API_TOKEN ?? "").trim();
  const secret = (env.PAYMENT_WEBHOOK_SECRET ?? "").trim();
  const mode = (env.PAYMENT_MODE ?? "test").trim();
  if (!baseUrl || !token) return { ok: false, reason: "not configured" };
  // Without a secret no notification could ever be verified: never start a payment.
  if (!secret) return { ok: false, reason: "webhook secret missing" };
  if (mode !== "test" && mode !== "live") return { ok: false, reason: "PAYMENT_MODE must be test or live" };
  // The signature does not cover the payment status, so live payments stay off until the gateway confirms how the
  // status can be verified (signed status or an order-status API) — see launch-checklist.md.
  if (mode === "live" && env.PAYMENT_LIVE_ENABLED !== "true") return { ok: false, reason: "live mode is blocked (PAYMENT_LIVE_ENABLED is not true)" };
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    return { ok: false, reason: "PAYMENT_API_BASE_URL is not a URL" };
  }
  // Always HTTPS with normal certificate checks; plain HTTP only to a local test double.
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(local && mode === "test")) return { ok: false, reason: "PAYMENT_API_BASE_URL must use https" };
  return { ok: true, baseUrl, token, secret, accountId: (env.PAYMENT_ACCOUNT_ID ?? "").trim(), mode };
}
