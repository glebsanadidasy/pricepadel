import "server-only";
import crypto from "node:crypto";
import { convert } from "@/config/currency";
import { normalizePhone, splitName } from "./customer-details";
import { checkoutUrlAllowed, gatewayConfig } from "./gateway-config";
import { orderAddress, orderItems, setGatewayOrder, type OrderRow } from "./orders";

/**
 * Card gateway — hosted payment page, redirect flow only (no card fields, no embedded or host-to-host variants).
 * The provider is never named in code, pages or e-mails; its addresses live only in .env.
 *
 *   create:  POST {api}/orders (Bearer token) → 201 { public_order_id, status, expires_at, checkout_url }
 *   notify:  POST /api/payments/notify  { event: "order.paid", status: "success", public_order_id, amount: "12.50",
 *            currency, timestamp, signature }  — signature = hex HMAC-SHA256(secret, public_order_id + amount) over the
 *            exact amount string from the request; header X-Webhook-Signature is accepted as a fallback.
 *   check:   POST {api}/merchants/test-connection (Bearer token)
 * TLS certificates are always verified (Node's default). Logs never contain secrets, signatures, request bodies or
 * customer details — only the order number, an HTTP status and a short reason.
 */
export const gateway = () => gatewayConfig(process.env);

export const log = (msg: string) => console.log(`[card-gateway] ${msg}`);

/** Money with exactly 2 decimals as a JSON number (12.50, not 12.5). */
const MONEY = "__money__";
const money = (minor: number) => `${MONEY}${(Math.round(minor) / 100).toFixed(2)}${MONEY}`;
const toJson = (v: unknown) => JSON.stringify(v).replace(new RegExp(`"${MONEY}([0-9.]+)${MONEY}"`, "g"), "$1");

/** Items in the charged currency; their total always equals the amount (a rounding penny goes to the last line). */
export function gatewayItems(order: OrderRow) {
  const lines = orderItems(order).map((i) => ({ name: i.name, minor: convert(i.unitPrice * i.qty, order.rate), quantity: i.qty }));
  if (order.delivery_gbp > 0) lines.push({ name: "Delivery", minor: convert(order.delivery_gbp, order.rate), quantity: 1 });
  const diff = order.total_charged - lines.reduce((n, l) => n + l.minor, 0);
  if (diff !== 0 && lines.length) lines[lines.length - 1].minor += diff;
  return lines;
}

export type CreateResult = { ok: true; checkoutUrl: string } | { ok: false };

/** Starts a payment for an order already saved in our database. The amount comes only from the order. */
export async function startCardPayment(order: OrderRow, paymentId: string, siteUrl: string): Promise<CreateResult> {
  const cfg = gateway();
  if (!cfg.ok) {
    log(`not started for ${order.number}: ${cfg.reason}`);
    return { ok: false };
  }
  const a = orderAddress(order);
  const who = splitName(a.full_name);
  const phone = normalizePhone(a.phone);
  if (!who || !phone) {
    log(`not started for ${order.number}: customer details incomplete`);
    return { ok: false };
  }
  const items = gatewayItems(order);
  const body = toJson({
    amount: money(order.total_charged),
    currency: order.currency.toUpperCase(),
    redirect_url: `${siteUrl}/checkout/result?order=${encodeURIComponent(order.number)}`,
    webhook_url: `${siteUrl}/api/payments/notify`,
    customer_details: {
      name: who.name,
      surname: who.surname,
      email: order.email,
      phone,
      country: a.country,
      address_line1: [a.line1, a.line2].filter(Boolean).join(", "),
      city: a.city,
      postal_code: a.postcode,
    },
    items: items.map((l) => ({ name: l.name, price: money(l.minor), quantity: l.quantity })),
  });
  let res: Response;
  try {
    res = await fetch(`${cfg.apiRoot}/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json", Accept: "application/json" },
      body,
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    log(`create failed for ${order.number}: network or certificate error`);
    return { ok: false };
  }
  if (res.status !== 201) {
    // 401 / 403 / 422 and anything else: status code only — never the body (it can echo customer data).
    log(`create failed for ${order.number}: HTTP ${res.status}${[401, 403].includes(res.status) ? " (token or access)" : res.status === 422 ? " (request rejected as invalid)" : ""}`);
    return { ok: false };
  }
  let data: { public_order_id?: unknown; status?: unknown; expires_at?: unknown; checkout_url?: unknown } = {};
  try {
    data = (await res.json()) as typeof data;
  } catch {
    /* handled below */
  }
  const publicId = typeof data.public_order_id === "string" || typeof data.public_order_id === "number" ? String(data.public_order_id) : "";
  const checkoutUrl = typeof data.checkout_url === "string" ? data.checkout_url : "";
  const expiresAt = typeof data.expires_at === "string" && !Number.isNaN(Date.parse(data.expires_at)) ? new Date(data.expires_at).toISOString() : null;
  if (!publicId || !checkoutUrl) {
    log(`create failed for ${order.number}: 201 without public_order_id or checkout_url`);
    return { ok: false };
  }
  // Saved at once, before the customer leaves: notifications are matched by this id.
  setGatewayOrder(paymentId, publicId, String(data.status ?? "pending"), expiresAt);
  if (!checkoutUrlAllowed(checkoutUrl, cfg)) {
    let host = "?";
    try {
      host = new URL(checkoutUrl).hostname;
    } catch {
      /* not a URL */
    }
    log(`create for ${order.number}: checkout_url host "${host}" is not allowed (PAYMENT_CHECKOUT_HOSTS) or not https — customer not redirected`);
    return { ok: false };
  }
  log(`payment started for ${order.number}`);
  return { ok: true, checkoutUrl };
}

/** The exact characters of "amount" in the raw JSON body (the signature covers this string, not a re-formatted number). */
export function rawAmount(raw: string): string | null {
  const m = raw.match(/"amount"\s*:\s*("(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/);
  if (!m) return null;
  return m[1].startsWith('"') ? (JSON.parse(m[1]) as string) : m[1];
}

/** Constant-time check of HMAC-SHA256(public_order_id + amount). */
export function signatureValid(secret: string, publicOrderId: string, amountText: string, signature: string) {
  if (!/^[0-9a-f]{64}$/i.test(signature)) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${publicOrderId}${amountText}`).digest();
  return crypto.timingSafeEqual(expected, Buffer.from(signature.toLowerCase(), "hex"));
}

/** Connection check for the admin panel: only yes/no facts are shown, never tokens or raw responses. */
export async function testConnection() {
  const cfg = gateway();
  if (!cfg.ok) return { connected: false, detail: cfg.reason };
  try {
    const res = await fetch(`${cfg.apiRoot}/merchants/test-connection`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.token}`, Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ webhook_secret: cfg.secret }),
      signal: AbortSignal.timeout(15000),
    });
    let data: Record<string, unknown> = {};
    try {
      data = (await res.json()) as Record<string, unknown>;
    } catch {
      /* not JSON */
    }
    const facts = [
      `HTTP ${res.status}`,
      "webhook_secret_matches" in data ? `secret matches: ${String(data.webhook_secret_matches)}` : null,
      "ip_status" in data ? `IP: ${String(data.ip_status)}` : null,
    ].filter(Boolean);
    return { connected: res.ok, detail: facts.join(", ") };
  } catch {
    return { connected: false, detail: "network or certificate error" };
  }
}
