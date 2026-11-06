"use server";

import { redirect } from "next/navigation";
import { userAddress } from "@/lib/addresses";
import { paymentDetailsProblem } from "@/lib/customer-details";
import { deliveryBlock, readSettings } from "@/lib/catalog-store";
import { requireUser, siteUrl } from "@/lib/auth";
import { gateway, startCardPayment } from "@/lib/gateway";
import { mockGatewayEnabled } from "@/lib/payments";
import { clearCart, MAX_QTY, readCart, resolveCart, writeCart } from "@/lib/cart";
import { getMoney } from "@/lib/currency";
import { findVariant } from "@/lib/catalog";
import { createOrder, getOrder, getOrderForUser, orderItems, retryPayment } from "@/lib/orders";

/** Sends the customer to the payment page: the card gateway if configured, the local simulation in development / tests. */
async function goToPayment(number: string, paymentId: string): Promise<never> {
  if (gateway().ok) {
    const r = await startCardPayment(getOrder(number)!, paymentId, await siteUrl());
    if (!r.ok) redirect(`/account/orders/${number}?pay=unavailable`);
    redirect(r.checkoutUrl);
  }
  if (mockGatewayEnabled()) redirect(`/mock-gateway/${paymentId}`);
  redirect(`/account/orders/${number}?pay=unavailable`);
}

/**
 * Places the order. The server re-reads the cart and re-checks every price and stock level; if anything changed since
 * the customer saw the summary, nothing is charged and the summary is shown again. Then the customer goes to the
 * payment gateway's own page — card details are never entered on this site.
 */
export async function placeOrder(form: FormData) {
  const user = await requireUser("/checkout");
  if (!user.email_verified_at) redirect("/checkout?e=verify");
  if (!gateway().ok && !mockGatewayEnabled()) redirect("/checkout?e=payments");
  if (form.get("terms") !== "yes") redirect("/checkout?e=terms");
  const address = userAddress(user.id, Number(form.get("address")));
  if (!address || deliveryBlock(address, readSettings())) redirect("/checkout?e=address");
  if (paymentDetailsProblem(address)) redirect("/checkout?e=details");

  const cart = resolveCart(await readCart());
  if (!cart.ok) redirect("/cart");
  const money = await getMoney();
  // The total the customer agreed to, in their currency; any difference means prices moved.
  if (String(form.get("expected")) !== `${money.currency}:${money.format(cart.total)}`) redirect("/checkout?e=changed");

  // The amount is computed on the server from the cart and saved with the order; nothing from the browser is used.
  const { number, paymentId } = createOrder({ userId: user.id, email: user.email, cart, address, currency: money.currency, rate: money.rate });
  await clearCart();
  await goToPayment(number, paymentId);
}

/** "Order again" for the customer's own expired order: puts the items that are still available back in the cart. */
export async function orderAgain(number: string) {
  const user = await requireUser(`/account/orders/${number}`);
  const o = getOrderForUser(number, user.id);
  if (!o) redirect("/account/orders");
  const lines = await readCart();
  for (const i of orderItems(o)) {
    if (!findVariant(i.sku)) continue;
    const l = lines.find((x) => x.sku === i.sku);
    if (l) l.qty = Math.min(MAX_QTY, l.qty + i.qty);
    else lines.push({ sku: i.sku, qty: Math.min(MAX_QTY, i.qty) });
  }
  await writeCart(lines);
  redirect("/cart");
}

/** New payment attempt for the customer's own unpaid order (after a decline or a cancel). */
export async function payAgain(number: string) {
  const user = await requireUser(`/account/orders/${number}`);
  const paymentId = retryPayment(number, user.id);
  if (!paymentId) redirect(`/account/orders/${number}`);
  await goToPayment(number, paymentId);
}
