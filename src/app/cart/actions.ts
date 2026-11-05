"use server";

import { revalidatePath } from "next/cache";
import { findVariant } from "@/lib/catalog";
import { MAX_QTY, readCart, writeCart } from "@/lib/cart";

/** Adds a variant (checked against the live catalogue) to the cart. No account needed. */
export async function addToCart(sku: string, qty = 1): Promise<{ ok: boolean; count: number; message: string }> {
  const lines = await readCart();
  const count = () => lines.reduce((n, l) => n + l.qty, 0);
  if (typeof sku !== "string" || !findVariant(sku)) return { ok: false, count: count(), message: "This option is not available." };
  const q = Math.min(MAX_QTY, Math.max(1, Math.floor(Number(qty)) || 1));
  const line = lines.find((l) => l.sku === sku);
  if (line) line.qty = Math.min(MAX_QTY, line.qty + q);
  else lines.push({ sku, qty: q });
  await writeCart(lines);
  revalidatePath("/", "layout");
  return { ok: true, count: count(), message: "Added to your cart." };
}

export async function setCartQty(sku: string, form: FormData) {
  const qty = Math.floor(Number(form.get("qty")));
  const lines = (await readCart()).map((l) => (l.sku === sku ? { ...l, qty: Math.min(MAX_QTY, Math.max(1, qty || 1)) } : l));
  await writeCart(lines);
  revalidatePath("/", "layout");
}

export async function removeFromCart(sku: string) {
  await writeCart((await readCart()).filter((l) => l.sku !== sku));
  revalidatePath("/", "layout");
}
