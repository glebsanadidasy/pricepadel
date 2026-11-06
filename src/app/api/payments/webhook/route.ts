import { NextResponse, type NextRequest } from "next/server";
import { db, now } from "@/lib/db";
import { applyNotification } from "@/lib/orders";
import { mockGatewayEnabled, SIGNATURE_HEADER, verifySignature, type Notification } from "@/lib/payments";

/**
 * Payment gateway → shop notification. The only way an order becomes Paid.
 * Rejected: missing / wrong / stale signature (401), malformed body, unknown payment, wrong order, wrong amount or currency (400).
 */
export async function POST(req: NextRequest) {
  // Local payment simulation only (tests, preview). The real gateway notifies /api/payments/notify.
  if (!mockGatewayEnabled()) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = await req.text();
  if (body.length > 10000 || !verifySignature(body, req.headers.get(SIGNATURE_HEADER))) {
    db().prepare("INSERT INTO payment_notifications (at, payment_id, accepted, reason) VALUES (?, NULL, 0, 'bad signature')").run(now());
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }
  let n: Notification;
  try {
    n = JSON.parse(body) as Notification;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const r = applyNotification(n);
  return NextResponse.json(r.ok ? { ok: true, result: r.reason } : { error: r.reason }, { status: r.ok ? 200 : 400 });
}
