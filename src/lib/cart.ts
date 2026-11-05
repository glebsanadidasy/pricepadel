import "server-only";
import { cookies } from "next/headers";
import { findVariant } from "./catalog";
import { readSettings } from "./catalog-store";
import type { Product, Variant } from "./catalog-types";

/**
 * The cart lives in a cookie as SKUs and quantities only — no prices. Every read re-checks each line against the
 * current catalogue (on sale, in stock, today's price), so the server is always the source of truth.
 */
const COOKIE = "pp_cart";
export const MAX_QTY = 10;
const MAX_LINES = 40;

export type CartLine = { sku: string; qty: number };
export type ResolvedLine = CartLine & { product?: Product; variant?: Variant; unitPrice: number; lineTotal: number; problem: string | null };
export type ResolvedCart = { lines: ResolvedLine[]; count: number; subtotal: number; delivery: number; total: number; ok: boolean };

export async function readCart(): Promise<CartLine[]> {
  try {
    const raw = JSON.parse((await cookies()).get(COOKIE)?.value ?? "[]") as unknown;
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((l): l is CartLine => typeof l?.sku === "string" && Number.isInteger(l?.qty))
      .map((l) => ({ sku: l.sku.slice(0, 80), qty: Math.min(MAX_QTY, Math.max(1, l.qty)) }))
      .slice(0, MAX_LINES);
  } catch {
    return [];
  }
}

export async function writeCart(lines: CartLine[]) {
  (await cookies()).set(COOKIE, JSON.stringify(lines.slice(0, MAX_LINES)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 24 * 3600,
  });
}

export async function clearCart() {
  (await cookies()).delete(COOKIE);
}

/** Prices in GBP pence. Delivery is the customer delivery price from the admin settings (free). */
export function resolveCart(lines: CartLine[]): ResolvedCart {
  const resolved = lines.map((l): ResolvedLine => {
    const hit = findVariant(l.sku);
    if (!hit) return { ...l, unitPrice: 0, lineTotal: 0, problem: "No longer available" };
    return { ...l, product: hit.product, variant: hit.variant, unitPrice: hit.variant.price, lineTotal: hit.variant.price * l.qty, problem: null };
  });
  const subtotal = resolved.reduce((n, l) => n + l.lineTotal, 0);
  const delivery = resolved.some((l) => !l.problem) ? readSettings().delivery.customerPrice : 0;
  return {
    lines: resolved,
    count: lines.reduce((n, l) => n + l.qty, 0),
    subtotal,
    delivery,
    total: subtotal + delivery,
    ok: resolved.length > 0 && resolved.every((l) => !l.problem),
  };
}

export async function cartCount() {
  return (await readCart()).reduce((n, l) => n + l.qty, 0);
}
