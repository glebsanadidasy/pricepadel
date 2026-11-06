/**
 * Card gateway settings (hosted payment page, redirect flow), read only from the environment (.env):
 *   PAYMENT_API_BASE_URL     the gateway API address, with or without a trailing /api
 *   PAYMENT_API_TOKEN        Bearer token (sandbox token on this computer; live tokens only on the production server)
 *   PAYMENT_WEBHOOK_SECRET   notification signing secret
 *   PAYMENT_ACCOUNT_ID       not used by the redirect flow
 *   PAYMENT_CHECKOUT_HOSTS   comma-separated host names the customer may be sent to (the gateway's payment page)
 *   PAYMENT_MODE=test|live, PAYMENT_LIVE_ENABLED=true only after every launch condition (launch-checklist.md)
 * Pure function (no server imports) so the rules can be tested on their own.
 */
export type GatewayConfig =
  | { ok: true; apiRoot: string; token: string; secret: string; accountId: string; mode: "test" | "live"; checkoutHosts: string[] }
  | { ok: false; reason: string };

type Env = Record<string, string | undefined>;

/** "https://x/api", "https://x/api/", "https://x" and "https://x/" all give "https://x/api" — never /api/api. */
export function apiRoot(baseUrl: string) {
  const trimmed = baseUrl.trim().replace(/\/+$/, "").replace(/\/api$/i, "");
  return `${trimmed}/api`;
}

const isLocal = (host: string) => host === "localhost" || host === "127.0.0.1";

export function gatewayConfig(env: Env): GatewayConfig {
  const base = (env.PAYMENT_API_BASE_URL ?? "").trim();
  const token = (env.PAYMENT_API_TOKEN ?? "").trim();
  const secret = (env.PAYMENT_WEBHOOK_SECRET ?? "").trim();
  const mode = (env.PAYMENT_MODE ?? "test").trim();
  const checkoutHosts = (env.PAYMENT_CHECKOUT_HOSTS ?? "").split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
  if (!base || !token) return { ok: false, reason: "not configured" };
  // Without a secret no notification could ever be verified: never start a payment.
  if (!secret) return { ok: false, reason: "webhook secret missing" };
  if (mode !== "test" && mode !== "live") return { ok: false, reason: "PAYMENT_MODE must be test or live" };
  if (mode === "live" && env.PAYMENT_LIVE_ENABLED !== "true") return { ok: false, reason: "live mode is blocked (PAYMENT_LIVE_ENABLED is not true)" };
  if (checkoutHosts.length === 0) return { ok: false, reason: "PAYMENT_CHECKOUT_HOSTS is empty" };
  let url: URL;
  try {
    url = new URL(apiRoot(base));
  } catch {
    return { ok: false, reason: "PAYMENT_API_BASE_URL is not a URL" };
  }
  // Always HTTPS with normal certificate checks; plain HTTP only to a local test double in test mode.
  if (url.protocol !== "https:" && !(isLocal(url.hostname) && mode === "test")) return { ok: false, reason: "PAYMENT_API_BASE_URL must use https" };
  return { ok: true, apiRoot: url.toString().replace(/\/+$/, ""), token, secret, accountId: (env.PAYMENT_ACCOUNT_ID ?? "").trim(), mode, checkoutHosts };
}

/** The customer is only ever sent to an HTTPS checkout page on an allowed host (HTTP only for a local test double). */
export function checkoutUrlAllowed(checkoutUrl: string, cfg: { mode: "test" | "live"; checkoutHosts: string[] }) {
  let u: URL;
  try {
    u = new URL(checkoutUrl);
  } catch {
    return false;
  }
  if (!cfg.checkoutHosts.includes(u.hostname.toLowerCase())) return false;
  return u.protocol === "https:" || (cfg.mode === "test" && isLocal(u.hostname) && u.protocol === "http:");
}
