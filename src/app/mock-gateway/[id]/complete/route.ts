import { NextResponse, type NextRequest } from "next/server";
import { getPayment } from "@/lib/orders";
import { mockGatewayEnabled, sign, SIGNATURE_HEADER, type Notification } from "@/lib/payments";

/**
 * LOCAL SIMULATION of what the gateway does after the customer acts on its page:
 * 1) sends a signed server-to-server notification to the shop, 2) sends the customer back to the shop.
 * The shop decides about the order only from the notification (see /api/payments/webhook).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!mockGatewayEnabled()) return new NextResponse("Not found", { status: 404 });
  const origin = req.headers.get("origin");
  if (origin && origin !== req.nextUrl.origin) return new NextResponse("Forbidden", { status: 403 });
  const p = getPayment((await params).id);
  if (!p) return new NextResponse("Not found", { status: 404 });
  const outcome = String((await req.formData()).get("outcome"));
  const type = outcome === "success" ? "payment.succeeded" : outcome === "declined" ? "payment.declined" : "payment.cancelled";
  if (p.status === "created") {
    const body = JSON.stringify({ type, payment_id: p.id, order_number: p.order_number, amount: p.amount, currency: p.currency } satisfies Notification);
    await fetch(new URL("/api/payments/webhook", req.nextUrl.origin), {
      method: "POST",
      headers: { "content-type": "application/json", [SIGNATURE_HEADER]: sign(body) },
      body,
    });
  }
  const back = new URL(`/checkout/result`, req.nextUrl.origin);
  back.searchParams.set("order", p.order_number);
  back.searchParams.set("outcome", outcome);
  return NextResponse.redirect(back, 303);
}
