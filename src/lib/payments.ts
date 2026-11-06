import "server-only";
import crypto from "node:crypto";

/**
 * Payment gateway boundary. Card details are only ever entered on the gateway's hosted page — never on this site.
 * Until a real gateway (Visa / Mastercard) is connected, a local simulation stands in for it (/mock-gateway):
 * it shows success / decline / cancel and sends a signed server-to-server notification like a real gateway would.
 *
 * Notification: POST /api/payments/webhook, JSON body, header `x-pp-signature: t=<unix>,v1=<hex HMAC-SHA256 of "t.body">`
 * with MOCK_PAYMENT_SECRET (the real gateway uses PAYMENT_WEBHOOK_SECRET, see lib/gateway.ts). An order becomes Paid only from a notification that passes every check.
 */
export const SIGNATURE_HEADER = "x-pp-signature";
const TOLERANCE_S = 300;

export type PaymentEvent = "payment.succeeded" | "payment.declined" | "payment.cancelled";
export type Notification = { type: PaymentEvent; payment_id: string; order_number: string; amount: number; currency: string };

/** The simulation runs in local development, or when MOCK_PAYMENTS=1 is set explicitly (tests). */
export function mockGatewayEnabled() {
  return process.env.MOCK_PAYMENTS === "1" || (process.env.NODE_ENV !== "production" && process.env.MOCK_PAYMENTS !== "0");
}

function secret() {
  const s = process.env.MOCK_PAYMENT_SECRET;
  if (!s || s.length < 32) throw new Error("MOCK_PAYMENT_SECRET is not set");
  return s;
}

export function sign(body: string, timestamp = Math.floor(Date.now() / 1000)) {
  const mac = crypto.createHmac("sha256", secret()).update(`${timestamp}.${body}`).digest("hex");
  return `t=${timestamp},v1=${mac}`;
}

export function verifySignature(body: string, header: string | null): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=", 2) as [string, string]));
  const t = Number(parts.t);
  if (!Number.isFinite(t) || Math.abs(Date.now() / 1000 - t) > TOLERANCE_S || !/^[0-9a-f]{64}$/.test(parts.v1 ?? "")) return false;
  const expected = crypto.createHmac("sha256", secret()).update(`${t}.${body}`).digest();
  return crypto.timingSafeEqual(expected, Buffer.from(parts.v1, "hex"));
}

export const newPaymentId = () => `pay_${crypto.randomBytes(16).toString("hex")}`;
