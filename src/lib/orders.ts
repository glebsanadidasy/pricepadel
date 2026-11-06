import "server-only";
import { BUSINESS } from "@/config/site";
import { countryName } from "@/config/countries";
import { convert, formatMinor, type CurrencyCode } from "@/config/currency";
import { readCatalog, readOffers } from "./catalog-store";
import type { ResolvedCart } from "./cart";
import { db, now, tx } from "./db";
import { sendMail } from "./mail";
import { newPaymentId, type Notification } from "./payments";

export const ORDER_STATUSES = ["Awaiting payment", "Paid", "Checking availability", "Ordered", "Shipped", "Delivered", "Cancelled", "Refunded"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderItem = { productId: string; slug: string; sku: string; name: string; brand: string; colour: string; size: string | null; qty: number; unitPrice: number };
export type Address = { id?: number; full_name: string; line1: string; line2: string; city: string; postcode: string; country: string; phone: string };

export type OrderRow = {
  id: number;
  number: string;
  user_id: number;
  status: OrderStatus;
  currency: CurrencyCode;
  rate: number;
  subtotal_gbp: number;
  delivery_gbp: number;
  total_gbp: number;
  total_charged: number;
  items_json: string;
  address_json: string;
  email: string;
  terms_accepted_at: string;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  tracking_number: string | null;
};

export const orderItems = (o: OrderRow) => JSON.parse(o.items_json) as OrderItem[];
export const orderAddress = (o: OrderRow) => JSON.parse(o.address_json) as Address;
export const charged = (o: OrderRow) => formatMinor(o.total_charged, o.currency);

/** Creates the order (Awaiting payment) and a payment session for the gateway, in one transaction. */
export function createOrder(input: { userId: number; email: string; cart: ResolvedCart; address: Address; currency: CurrencyCode; rate: number }) {
  const { cart } = input;
  const items: OrderItem[] = cart.lines.map((l) => ({
    productId: l.product!.id,
    slug: l.product!.slug,
    sku: l.sku,
    name: l.product!.name,
    brand: l.product!.brand,
    colour: l.variant!.colour,
    size: l.variant!.size ?? null,
    qty: l.qty,
    unitPrice: l.unitPrice,
  }));
  const totalCharged = convert(cart.total, input.rate);
  const at = now();
  return tx(() => {
    const r = db()
      .prepare(
        `INSERT INTO orders (number, user_id, status, currency, rate, subtotal_gbp, delivery_gbp, total_gbp, total_charged, items_json, address_json, email, terms_accepted_at, created_at, updated_at)
         VALUES ('pending', ?, 'Awaiting payment', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(input.userId, input.currency, input.rate, cart.subtotal, cart.delivery, cart.total, totalCharged, JSON.stringify(items), JSON.stringify(input.address), input.email, at, at, at);
    const id = Number(r.lastInsertRowid);
    const number = `PP${100000 + id}`;
    db().prepare("UPDATE orders SET number = ? WHERE id = ?").run(number, id);
    db().prepare("INSERT INTO order_events (order_id, at, status, note, actor) VALUES (?, ?, 'Awaiting payment', 'Order placed', 'customer')").run(id, at);
    const paymentId = newPayment(id, totalCharged, input.currency);
    return { number, paymentId };
  });
}

function newPayment(orderId: number, amount: number, currency: string) {
  const id = newPaymentId();
  const at = now();
  db().prepare("INSERT INTO payments (id, order_id, amount, currency, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'created', ?, ?)").run(id, orderId, amount, currency, at, at);
  return id;
}

/** A fresh payment attempt for an unpaid order of this customer (after a decline or a cancel). */
export function retryPayment(number: string, userId: number) {
  const o = getOrderForUser(number, userId);
  if (!o || o.status !== "Awaiting payment") return null;
  return newPayment(o.id, o.total_charged, o.currency);
}

export function getOrderForUser(number: string, userId: number) {
  return db().prepare("SELECT * FROM orders WHERE number = ? AND user_id = ?").get(number, userId) as OrderRow | undefined;
}

export function getOrder(number: string) {
  return db().prepare("SELECT * FROM orders WHERE number = ?").get(number) as OrderRow | undefined;
}

export function listOrdersForUser(userId: number) {
  return db().prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC").all(userId) as OrderRow[];
}

export function listOrders(limit = 200) {
  return db().prepare("SELECT * FROM orders ORDER BY id DESC LIMIT ?").all(limit) as OrderRow[];
}

export function orderEvents(orderId: number) {
  return db().prepare("SELECT at, status, note, actor FROM order_events WHERE order_id = ? ORDER BY id").all(orderId) as { at: string; status: string; note: string; actor: string }[];
}

export function getPayment(id: string) {
  return db().prepare("SELECT p.*, o.number AS order_number FROM payments p JOIN orders o ON o.id = p.order_id WHERE p.id = ?").get(id) as
    | { id: string; order_id: number; amount: number; currency: string; status: string; order_number: string }
    | undefined;
}

export function lastPaymentStatus(orderId: number) {
  return (db().prepare("SELECT status FROM payments WHERE order_id = ? ORDER BY rowid DESC LIMIT 1").get(orderId) as { status: string } | undefined)?.status ?? null;
}

export function setOrderStatus(orderId: number, status: OrderStatus, note: string, actor: string) {
  const at = now();
  db().prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?").run(status, at, orderId);
  db().prepare("INSERT INTO order_events (order_id, at, status, note, actor) VALUES (?, ?, ?, ?, ?)").run(orderId, at, status, note, actor);
}

/**
 * Applies a gateway notification whose signature was already verified. Every other check happens here:
 * known payment, matching order, amount and currency, and a status the payment can still move from.
 */
export function applyNotification(n: Notification): { ok: boolean; reason: string } {
  const record = (accepted: boolean, reason: string) => {
    db().prepare("INSERT INTO payment_notifications (at, payment_id, accepted, reason) VALUES (?, ?, ?, ?)").run(now(), String(n.payment_id ?? ""), accepted ? 1 : 0, reason);
    return { ok: accepted, reason };
  };
  if (!["payment.succeeded", "payment.declined", "payment.cancelled"].includes(n.type)) return record(false, "unknown event type");
  const p = typeof n.payment_id === "string" ? getPayment(n.payment_id) : undefined;
  if (!p) return record(false, "unknown payment");
  if (p.order_number !== n.order_number) return record(false, "order does not match the payment");
  if (!Number.isInteger(n.amount) || n.amount !== p.amount || n.currency !== p.currency) return record(false, "amount or currency does not match");
  const order = getOrder(p.order_number)!;
  if (order.total_charged !== p.amount || order.currency !== p.currency) return record(false, "amount or currency does not match the order");
  if (p.status !== "created") return record(true, `already ${p.status}`); // repeated notification: nothing to do

  const status = n.type === "payment.succeeded" ? "succeeded" : n.type === "payment.declined" ? "declined" : "cancelled";
  let paid = false;
  tx(() => {
    db().prepare("UPDATE payments SET status = ?, updated_at = ? WHERE id = ?").run(status, now(), p.id);
    if (status === "succeeded" && order.status === "Awaiting payment") {
      db().prepare("UPDATE orders SET paid_at = ? WHERE id = ?").run(now(), order.id);
      setOrderStatus(order.id, "Paid", `Payment ${p.id} confirmed by the payment gateway`, "gateway");
      paid = true;
    } else if (status !== "succeeded") {
      db().prepare("INSERT INTO order_events (order_id, at, status, note, actor) VALUES (?, ?, ?, ?, 'gateway')").run(order.id, now(), order.status, `Payment ${status}`);
    }
  });
  if (paid) sendOrderEmails(getOrder(order.number)!);
  return record(true, status);
}

// ---------- e-mails ----------

const STATUS_MAIL: Partial<Record<OrderStatus, { subject: string; text: string }>> = {
  Ordered: {
    subject: "accepted",
    text: "Good news: the items in your order are available and we have accepted your order. This e-mail is our acceptance of your order (see our Terms & Conditions). We will e-mail you again when it has been dispatched.",
  },
  Shipped: { subject: "dispatched", text: "Your order has been dispatched. Delivery usually takes 7–10 working days after payment (an estimate); we will tell you if it is delayed." },
  Delivered: { subject: "delivered", text: "Your order has been marked as delivered. If anything is wrong with it, please reply to this e-mail." },
  Cancelled: {
    subject: "cancelled",
    text: "Your order has been cancelled. If you had paid, the full amount — including any delivery charge — is refunded to the card you paid with.",
  },
  Refunded: { subject: "refunded", text: "We have refunded your order to the card you paid with. Depending on your bank, it can take a few working days to appear." },
};

/** Tells the customer about a status change made in the admin panel (saved to outbox/ until mail is connected). */
export function sendStatusEmail(o: OrderRow, status: OrderStatus, note: string, tracking?: string | null) {
  const m = STATUS_MAIL[status];
  if (!m) return;
  const track = status === "Shipped" && tracking ? `\nTracking number: ${tracking}` : "";
  sendMail({
    to: o.email,
    subject: `Your Price Padel order ${o.number} has been ${m.subject}`,
    text: [`Order ${o.number}`, "", m.text + track, note && `\nNote from us: ${note}`, "", `Questions? ${BUSINESS.email}, ${BUSINESS.phone} (${BUSINESS.hours}).`].filter((x) => x !== "").join("\n"),
  });
}

function itemLines(o: OrderRow, withSource: boolean) {
  const offers = withSource ? readOffers() : {};
  const catalog = withSource ? new Map(readCatalog().map((p) => [p.id, p])) : new Map();
  return orderItems(o).map((i) => {
    const line = `- ${i.qty} × ${i.name} (${[i.colour, i.size].filter(Boolean).join(", ") || "one size"}), SKU ${i.sku} — ${formatMinor(i.unitPrice, "GBP")} each`;
    if (!withSource) return line;
    const offer = offers[i.productId];
    const v = offer?.variants[i.sku];
    const src = catalog.get(i.productId) ? `\n    source: ${offer?.sourceUrl ?? "?"} | source price ${v ? formatMinor(v.sourcePrice, "GBP") : "?"} | source SKU ${v?.sourceSku ?? "?"}` : "";
    return line + src;
  });
}

function addressBlock(a: Address) {
  return [a.full_name, a.line1, a.line2, `${a.postcode} ${a.city}`, countryName(a.country), a.phone && `Phone: ${a.phone}`].filter(Boolean).join("\n");
}

function sendOrderEmails(o: OrderRow) {
  const totals = [
    `Subtotal: ${formatMinor(o.subtotal_gbp, "GBP")}`,
    `Delivery: ${o.delivery_gbp === 0 ? "Free delivery (£0.00)" : formatMinor(o.delivery_gbp, "GBP")}`,
    `Total: ${formatMinor(o.total_gbp, "GBP")}${o.currency !== "GBP" ? ` — charged ${charged(o)} (1 GBP = ${o.rate} ${o.currency})` : ""}`,
  ];
  sendMail({
    to: BUSINESS.email,
    subject: `New paid order ${o.number}`,
    text: [
      `Order ${o.number} has been paid (${o.paid_at}).`,
      "",
      `Customer: ${o.email}`,
      "",
      "Items:",
      ...itemLines(o, true),
      "",
      ...totals,
      "",
      "Delivery address:",
      addressBlock(orderAddress(o)),
      "",
      `Terms accepted: ${o.terms_accepted_at}`,
    ].join("\n"),
  });
  sendMail({
    to: o.email,
    subject: `Your Price Padel order ${o.number}`,
    text: [
      "Thank you for your order.",
      "",
      `Order number: ${o.number}`,
      "We have received your payment. This e-mail confirms we received your order; it is not yet our acceptance of it.",
      "We will now check that the items are available and e-mail you when we accept your order. If an item is not available, we will cancel it and refund you in full.",
      "",
      "Items:",
      ...itemLines(o, false),
      "",
      ...totals,
      "",
      "Delivery address:",
      addressBlock(orderAddress(o)),
      "",
      `Questions? ${BUSINESS.email}, ${BUSINESS.phone} (${BUSINESS.hours}).`,
    ].join("\n"),
  });
}
