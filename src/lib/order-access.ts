import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { currentUser, sha256 } from "./auth";
import { getOrderForGuest, getOrderForUser, type OrderRow } from "./orders";

/**
 * Who may see an order: the signed-in customer who placed it, or a guest holding the order's secret token
 * (from the private link in the e-mail, or the cookie set in the browser that placed the order). Anyone else: not found.
 */
const cookieName = (number: string) => `pp_order_${number}`;

export const newGuestToken = () => {
  const token = crypto.randomBytes(24).toString("base64url");
  return { token, hash: sha256(token) };
};

export async function rememberGuestOrder(number: string, token: string) {
  (await cookies()).set(cookieName(number), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 90 * 24 * 3600,
  });
}

/** The order if the visitor may see it. `token` = from the private link (?t=…), otherwise the cookie is used. */
export async function viewableOrder(number: string, token?: string): Promise<{ order: OrderRow; guest: boolean } | null> {
  const user = await currentUser();
  if (user) {
    const own = getOrderForUser(number, user.id);
    if (own) return { order: own, guest: false };
  }
  const t = token || (await cookies()).get(cookieName(number))?.value || "";
  const o = t ? getOrderForGuest(number, t) : undefined;
  return o ? { order: o, guest: true } : null;
}

/** Where the visitor sees this order: the account page for customers, the private order page for guests. */
export const orderPath = (number: string, guest: boolean) => (guest ? `/orders/${number}` : `/account/orders/${number}`);
