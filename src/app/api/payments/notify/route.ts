import { NextResponse, type NextRequest } from "next/server";
import { db, now } from "@/lib/db";
import { gateway, log, rawAmount, signatureValid } from "@/lib/gateway";
import { expireStalePayments, getOrder, getPaymentByGatewayId, recordLatePayment, settlePayment } from "@/lib/orders";

/**
 * Card gateway → shop notification. An order becomes Paid only if ALL of these hold:
 * the secret is configured; event "order.paid" with status "success"; the signature over public_order_id + the exact
 * amount string is valid; the gateway order id is ours; amount and currency match the order; the order still awaits
 * payment and its payment page has not expired. A payment that arrives after the order expired or was closed is
 * stored for a manual check (admin warning), never applied automatically. Repeats change nothing.
 * Answers are short and generic; logs carry only the order number and a reason.
 */
const record = (paymentId: string | null, accepted: boolean, reason: string) =>
  db().prepare("INSERT INTO payment_notifications (at, payment_id, accepted, reason) VALUES (?, ?, ?, ?)").run(now(), paymentId, accepted ? 1 : 0, reason);

const reject = (status: number, reason: string, paymentId: string | null = null, order = "-") => {
  record(paymentId, false, reason);
  log(`notification rejected (${reason}), order ${order}`);
  return NextResponse.json({ status: "error" }, { status });
};

const STATUSES = new Set(["pending", "success", "failed", "expired"]);

export async function POST(req: NextRequest) {
  // The secret check comes first: without it no notification can be trusted (and no payment was started).
  const secret = (process.env.PAYMENT_WEBHOOK_SECRET ?? "").trim();
  if (!secret) return reject(503, "webhook secret not configured");
  if (!gateway().ok) return reject(503, "gateway not enabled");

  const raw = await req.text();
  if (raw.length > 20000) return reject(413, "body too large");
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return reject(400, "invalid body");
  }
  const publicId = typeof data.public_order_id === "string" || typeof data.public_order_id === "number" ? String(data.public_order_id) : "";
  const amountText = rawAmount(raw);
  const event = String(data.event ?? "");
  const status = String(data.status ?? "").toLowerCase();
  if (!publicId || amountText === null || !status) return reject(400, "missing fields");

  // Signature in the body; X-Webhook-Signature header as a fallback.
  const signature = String(data.signature ?? req.headers.get("x-webhook-signature") ?? "");
  if (!signature) return reject(401, "signature missing");
  if (!signatureValid(secret, publicId, amountText, signature)) return reject(401, "signature invalid");

  if (!STATUSES.has(status)) return reject(400, "unknown status");
  if (status === "success" && event !== "order.paid") return reject(400, "success without event order.paid");
  if (event && !event.startsWith("order.")) return reject(400, "unknown event");

  expireStalePayments();
  const p = getPaymentByGatewayId(publicId);
  if (!p) return reject(404, "unknown gateway order");
  if (!/^\d+(\.\d{1,2})?$/.test(amountText) || Math.round(Number(amountText) * 100) !== p.amount) return reject(400, "amount does not match", p.id, p.order_number);
  if (String(data.currency ?? "").toUpperCase() !== p.currency) return reject(400, "currency does not match", p.id, p.order_number);

  if (status === "pending") {
    record(p.id, true, "pending");
    return NextResponse.json({ status: "success" });
  }
  if (status === "success") {
    const order = getOrder(p.order_number)!;
    const expired = p.status === "expired" || (p.expires_at !== null && p.expires_at < now() && p.status === "created");
    if (p.status !== "succeeded" && (expired || (order.status !== "Awaiting payment" && order.status !== "Paid"))) {
      recordLatePayment(p, expired ? "Expired" : order.status);
      record(p.id, true, "late payment stored for manual check");
      log(`late payment for ${p.order_number} stored for manual check`);
      return NextResponse.json({ status: "success" });
    }
  }
  const result = settlePayment(p, status === "success" ? "succeeded" : status === "failed" ? "declined" : "expired");
  record(p.id, true, result);
  log(`notification accepted (${result}), order ${p.order_number}`);
  return NextResponse.json({ status: "success" });
}
