"use server";

import { redirect } from "next/navigation";
import { userAddress } from "@/lib/addresses";
import { readSettings } from "@/lib/catalog-store";
import { requireUser } from "@/lib/auth";
import { clearCart, readCart, resolveCart } from "@/lib/cart";
import { getMoney } from "@/lib/currency";
import { createOrder, retryPayment } from "@/lib/orders";

/**
 * Places the order. The server re-reads the cart and re-checks every price and stock level; if anything changed since
 * the customer saw the summary, nothing is charged and the summary is shown again. Then the customer goes to the
 * payment gateway's own page — card details are never entered on this site.
 */
export async function placeOrder(form: FormData) {
  const user = await requireUser("/checkout");
  if (!user.email_verified_at) redirect("/checkout?e=verify");
  if (form.get("terms") !== "yes") redirect("/checkout?e=terms");
  const address = userAddress(user.id, Number(form.get("address")));
  if (!address || !readSettings().delivery.countries.includes(address.country)) redirect("/checkout?e=address");

  const cart = resolveCart(await readCart());
  if (!cart.ok) redirect("/cart");
  const money = await getMoney();
  // The total the customer agreed to, in their currency; any difference means prices moved.
  if (String(form.get("expected")) !== `${money.currency}:${money.format(cart.total)}`) redirect("/checkout?e=changed");

  const { paymentId } = createOrder({ userId: user.id, email: user.email, cart, address, currency: money.currency, rate: money.rate });
  await clearCart();
  redirect(`/mock-gateway/${paymentId}`);
}

/** New payment attempt for the customer's own unpaid order (after a decline or a cancel). */
export async function payAgain(number: string) {
  const user = await requireUser(`/account/orders/${number}`);
  const paymentId = retryPayment(number, user.id);
  if (!paymentId) redirect(`/account/orders/${number}`);
  redirect(`/mock-gateway/${paymentId}`);
}
