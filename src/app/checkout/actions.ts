"use server";

import { redirect } from "next/navigation";
import { isCountry } from "@/config/countries";
import { userAddress } from "@/lib/addresses";
import { attemptKey, currentUser, recordAttempt, siteUrl, tooManyAttempts } from "@/lib/auth";
import { findVariant } from "@/lib/catalog";
import { deliveryBlock, readSettings } from "@/lib/catalog-store";
import { clearCart, MAX_QTY, readCart, resolveCart, writeCart } from "@/lib/cart";
import { getMoney } from "@/lib/currency";
import { DETAILS_HELP, normalizePhone, paymentDetailsProblem, splitName } from "@/lib/customer-details";
import { gateway, startCardPayment } from "@/lib/gateway";
import { newGuestToken, orderPath, rememberGuestOrder, viewableOrder } from "@/lib/order-access";
import { createOrder, getOrder, orderItems, retryPayment, sendGuestOrderLink, type Address } from "@/lib/orders";
import { mockGatewayEnabled } from "@/lib/payments";

/** Sends the customer to the payment page: the card gateway if configured, the local simulation in development / tests. */
async function goToPayment(number: string, paymentId: string, guest: boolean): Promise<never> {
  const back = `${orderPath(number, guest)}?pay=unavailable`;
  if (gateway().ok) {
    const r = await startCardPayment(getOrder(number)!, paymentId, await siteUrl());
    if (!r.ok) redirect(back);
    redirect(r.checkoutUrl);
  }
  if (mockGatewayEnabled()) redirect(`/mock-gateway/${paymentId}`);
  redirect(back);
}

const paymentsAvailable = () => gateway().ok || mockGatewayEnabled();

/** Cart re-checked on the server; the total must be the one the customer saw. Returns null when it changed. */
async function checkedCart(expected: FormDataEntryValue | null) {
  const cart = resolveCart(await readCart());
  if (!cart.ok) redirect("/cart");
  const money = await getMoney();
  if (String(expected) !== `${money.currency}:${money.format(cart.total)}`) return null;
  return { cart, money };
}

/**
 * Places the order of a signed-in customer. The server re-reads the cart and re-checks every price and stock level;
 * if anything changed since the customer saw the summary, nothing is charged and the summary is shown again.
 * Then the customer goes to the payment gateway's own page — card details are never entered on this site.
 */
export async function placeOrder(form: FormData) {
  const user = await currentUser();
  if (!user) redirect("/checkout");
  if (!user.email_verified_at) redirect("/checkout?e=verify");
  if (!paymentsAvailable()) redirect("/checkout?e=payments");
  if (form.get("terms") !== "yes") redirect("/checkout?e=terms");
  const address = userAddress(user.id, Number(form.get("address")));
  if (!address || deliveryBlock(address, readSettings())) redirect("/checkout?e=address");
  if (paymentDetailsProblem(address)) redirect("/checkout?e=details");
  const checked = await checkedCart(form.get("expected"));
  if (!checked) redirect("/checkout?e=changed");

  // The amount is computed on the server from the cart and saved with the order; nothing from the browser is used.
  const { number, paymentId } = createOrder({ userId: user.id, email: user.email, cart: checked.cart, address, currency: checked.money.currency, rate: checked.money.rate });
  await clearCart();
  await goToPayment(number, paymentId, false);
}

export type GuestState = { error?: string; values?: Record<string, string> } | undefined;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

/**
 * Guest checkout: no account. Every field the payment provider and the carrier need is asked here and checked on the
 * server: e-mail, first name + surname, phone with country code, UK address (blocked areas refused).
 */
export async function placeGuestOrder(_: GuestState, form: FormData): Promise<GuestState> {
  const v = (k: string, max = 150) => String(form.get(k) ?? "").trim().slice(0, max);
  const values = { email: v("email", 254).toLowerCase(), full_name: v("full_name", 100), phone: v("phone", 30), line1: v("line1"), line2: v("line2"), city: v("city", 80), postcode: v("postcode", 20).toUpperCase(), country: v("country", 2) };
  const fail = (error: string): GuestState => ({ error, values });
  if (!paymentsAvailable()) return fail("Card payment is temporarily unavailable. Please try again later — nothing has been charged.");
  if (!EMAIL.test(values.email)) return fail("Please enter a valid e-mail address.");
  if (!splitName(values.full_name) || !normalizePhone(values.phone)) return fail(DETAILS_HELP);
  if (!values.line1 || !values.city || !values.postcode) return fail("Please fill in your address, city and postcode.");
  if (!isCountry(values.country)) return fail("We currently deliver to the UK only.");
  const address: Address = { full_name: values.full_name, phone: normalizePhone(values.phone)!, line1: values.line1, line2: values.line2, city: values.city, postcode: values.postcode, country: values.country };
  const blocked = deliveryBlock(address, readSettings());
  if (blocked) return fail(blocked);
  if (form.get("terms") !== "yes") return fail("Please accept the Terms & Conditions to continue.");
  const key = await attemptKey("guest-order");
  if (tooManyAttempts(key, 10, 3600 * 1000)) return fail("Too many orders from here. Please try again later or contact us.");
  const checked = await checkedCart(form.get("expected"));
  if (!checked) return fail("Prices or stock changed while you were checking out. Please review the updated summary.");
  recordAttempt(key);

  const { token, hash } = newGuestToken();
  const { number, paymentId } = createOrder({ userId: null, guestTokenHash: hash, email: values.email, cart: checked.cart, address, currency: checked.money.currency, rate: checked.money.rate });
  await rememberGuestOrder(number, token);
  sendGuestOrderLink(getOrder(number)!, `${await siteUrl()}/orders/${number}?t=${token}`);
  await clearCart();
  await goToPayment(number, paymentId, true);
}

/** "Order again" for an expired order the visitor may see: puts the items that are still available back in the cart. */
export async function orderAgain(number: string, token?: string) {
  const access = await viewableOrder(number, token);
  if (!access) redirect("/cart");
  const lines = await readCart();
  for (const i of orderItems(access.order)) {
    if (!findVariant(i.sku)) continue;
    const l = lines.find((x) => x.sku === i.sku);
    if (l) l.qty = Math.min(MAX_QTY, l.qty + i.qty);
    else lines.push({ sku: i.sku, qty: Math.min(MAX_QTY, i.qty) });
  }
  await writeCart(lines);
  redirect("/cart");
}

/** New payment attempt for an unpaid order the visitor may see (after a decline or a cancel). */
export async function payAgain(number: string, token?: string) {
  const access = await viewableOrder(number, token);
  if (!access) redirect("/");
  const paymentId = retryPayment(access.order);
  if (!paymentId) redirect(orderPath(number, access.guest));
  if (access.guest && token) await rememberGuestOrder(number, token);
  await goToPayment(number, paymentId, access.guest);
}

