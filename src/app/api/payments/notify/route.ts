import { NextResponse, type NextRequest } from "next/server";
import { db, now } from "@/lib/db";
import { gateway, log, signatureValid } from "@/lib/gateway";
import { getPaymentByGatewayId, settlePayment } from "@/lib/orders";

/**
 * Card gateway → shop notification. An order becomes Paid only if ALL of these hold:
 * the secret is configured, the signature is valid, the gateway order id is ours, amount and currency match the order,
 * and the order is still awaiting payment. Repeats change nothing; "failed" / "canceled" never undo Paid.
 * Answers are short and generic; logs carry only the order number and a reason.
 */
const record = (paymentId: string | null, accepted: boolean, reason: string) =>
  db().prepare("INSERT INTO payment_notifications (at, payment_id, accepted, reason) VALUES (?, ?, ?, ?)").run(now(), paymentId, accepted ? 1 : 0, reason);

const reject = (status: number, reason: string, paymentId: string | null = null, order = "-") => {
  record(paymentId, false, reason);
  log(`notification rejected (${reason}), order ${order}`);
  return NextResponse.json({ status: "error" }, { status });
};

export async function POST(req: NextRequest) {
  // The secret check comes first: without it no notification can be trusted (and no payment was started).
  const secret = (process.env.PAYMENT_WEBHOOK_SECRET ?? "").trim();
  if (!secret) return reject(503, "webhook secret not configured");
  const cfg = gateway();
  if (!cfg.ok) return reject(503, "gateway not enabled");

  const raw = await req.text();
  if (raw.length > 20000) return reject(413, "body too large");
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return reject(400, "invalid body");
  }
  const publicId = typeof data.public_order_id === "string" || typeof data.public_order_id === "number" ? String(data.public_order_id) : "";
  const status = String(data.status ?? "").toLowerCase();
  if (!publicId || !status || data.amount === undefined) return reject(400, "missing fields");

  const signature = String(req.headers.get("x-webhook-signature") ?? data.signature ?? "");
  if (!signature) return reject(401, "signature missing");
  if (!signatureValid(secret, publicId, data.amount, signature)) return reject(401, "signature invalid");

  const p = getPaymentByGatewayId(publicId);
  if (!p) return reject(404, "unknown gateway order");
  const amountMinor = Math.round(Number(data.amount) * 100);
  if (!Number.isFinite(amountMinor) || amountMinor !== p.amount) return reject(400, "amount does not match", p.id, p.order_number);
  if (String(data.currency ?? "").toUpperCase() !== p.currency) return reject(400, "currency does not match", p.id, p.order_number);

  const outcome = status === "success" || status === "completed" ? "succeeded" : status === "failed" ? "declined" : status === "canceled" || status === "cancelled" ? "cancelled" : null;
  if (!outcome) return reject(400, "unknown status", p.id, p.order_number);
  const result = settlePayment(p, outcome);
  record(p.id, true, result);
  log(`notification accepted (${result}), order ${p.order_number}`);
  return NextResponse.json({ status: "success" });
}
