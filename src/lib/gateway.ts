import "server-only";
import crypto from "node:crypto";
import { convert } from "@/config/currency";
import { gatewayConfig } from "./gateway-config";
import { orderAddress, orderItems, setGatewayOrderId, type OrderRow } from "./orders";

/**
 * Card gateway — hosted payment page, redirect flow only (no card fields, no embedded or host-to-host variants).
 * The provider is never named in code, pages or e-mails; only the redirect to its payment page shows its address.
 *
 *   create:  POST {base}/api/orders  (Bearer token)  → { checkout_url, public_order_id }
 *   notify:  POST /api/payments/notify  { public_order_id, amount, currency, status, signature? }
 *            signature = hex HMAC-SHA256(PAYMENT_WEBHOOK_SECRET, public_order_id + amount), header X-Webhook-Signature
 *   check:   POST {base}/api/merchants/test-connection  (Bearer token)
 * TLS certificates are always verified (Node's default). Logs never contain secrets, signatures, request bodies or
 * customer details — only the order number and a short reason.
 */
export const gateway = () => gatewayConfig(process.env);

export const log = (msg: string) => console.log(`[card-gateway] ${msg}`);

/** Amount in major units as the gateway expects it (2 decimals), computed only from the stored order. */
const major = (minor: number) => Math.round(minor) / 100;

export type CreateResult = { ok: true; checkoutUrl: string } | { ok: false };

/** Starts a payment for an order already saved in our database. The amount comes only from the order. */
export async function startCardPayment(order: OrderRow, paymentId: string, siteUrl: string): Promise<CreateResult> {
  const cfg = gateway();
  if (!cfg.ok) {
    log(`not started for ${order.number}: ${cfg.reason}`);
    return { ok: false };
  }
  const a = orderAddress(order);
  const [name, ...rest] = a.full_name.trim().split(/\s+/);
  const items = orderItems(order).map((i) => ({ name: i.name, price: major(convert(i.unitPrice * i.qty, order.rate)), quantity: i.qty }));
  if (order.delivery_gbp > 0) items.push({ name: "Delivery", price: major(convert(order.delivery_gbp, order.rate)), quantity: 1 });
  const payload = {
    amount: major(order.total_charged),
    currency: order.currency,
    redirect_url: `${siteUrl}/checkout/result?order=${encodeURIComponent(order.number)}`,
    webhook_url: `${siteUrl}/api/payments/notify`,
    customer_details: {
      name: name ?? "",
      surname: rest.join(" "),
      email: order.email,
      phone: a.phone,
      address_line1: [a.line1, a.line2].filter(Boolean).join(", "),
      city: a.city,
      postal_code: a.postcode,
      country: a.country,
    },
    items,
  };
  let res: Response;
  try {
    res = await fetch(`${cfg.baseUrl}/api/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    log(`create failed for ${order.number}: network error`);
    return { ok: false };
  }
  let data: { checkout_url?: unknown; public_order_id?: unknown } = {};
  try {
    data = (await res.json()) as typeof data;
  } catch {
    /* handled below */
  }
  const checkoutUrl = typeof data.checkout_url === "string" ? data.checkout_url : "";
  const publicId = typeof data.public_order_id === "string" || typeof data.public_order_id === "number" ? String(data.public_order_id) : "";
  let urlOk = false;
  try {
    const u = new URL(checkoutUrl);
    urlOk = u.protocol === "https:" || (cfg.mode === "test" && (u.hostname === "localhost" || u.hostname === "127.0.0.1"));
  } catch {
    /* not a URL */
  }
  if (!res.ok || !urlOk || !publicId) {
    log(`create failed for ${order.number}: HTTP ${res.status}, ${urlOk ? "" : "no valid checkout_url, "}${publicId ? "" : "no public_order_id"}`);
    return { ok: false };
  }
  // Saved at once, before the customer leaves: notifications are matched by this id.
  setGatewayOrderId(paymentId, publicId);
  log(`payment started for ${order.number}`);
  return { ok: true, checkoutUrl };
}

/** Constant-time check of the notification signature: HMAC-SHA256(public_order_id + amount). */
export function signatureValid(secret: string, publicOrderId: string, amount: unknown, signature: string) {
  if (!/^[0-9a-f]{64}$/i.test(signature)) return false;
  const given = Buffer.from(signature.toLowerCase(), "hex");
  // The amount is signed as the gateway writes it; accept the plain number form and the 2-decimal form.
  const forms = new Set([String(amount), typeof amount === "number" || /^\d+(\.\d+)?$/.test(String(amount)) ? Number(amount).toFixed(2) : String(amount)]);
  let ok = false;
  for (const f of forms) {
    const expected = crypto.createHmac("sha256", secret).update(`${publicOrderId}${f}`).digest();
    if (crypto.timingSafeEqual(expected, given)) ok = true;
  }
  return ok;
}

/** Connection check for the admin panel: only yes/no facts are shown, never tokens or raw responses. */
export async function testConnection() {
  const cfg = gateway();
  if (!cfg.ok) return { connected: false, detail: cfg.reason };
  try {
    const res = await fetch(`${cfg.baseUrl}/api/merchants/test-connection`, {
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
