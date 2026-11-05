"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminPasswordMatches, assertAdmin, attemptKey, recordAttempt, signInAdmin, signOutAdmin, tooManyAttempts } from "@/lib/auth";
import { readSettings, writeSettings, type CatalogSettings } from "@/lib/catalog-store";
import { CATEGORY_LABELS, type Category } from "@/lib/catalog-types";
import { getOrder, ORDER_STATUSES, setOrderStatus, type OrderStatus } from "@/lib/orders";

export type AdminFormState = { error?: string } | undefined;

export async function adminLogin(_: AdminFormState, form: FormData): Promise<AdminFormState> {
  const key = await attemptKey("admin-login");
  if (tooManyAttempts(key, 5, 15 * 60 * 1000)) return { error: "Too many attempts. Wait 15 minutes." };
  if (!adminPasswordMatches(String(form.get("password") ?? ""))) {
    recordAttempt(key);
    return { error: "Wrong password." };
  }
  await signInAdmin();
  redirect("/admin");
}

export async function adminLogout() {
  await signOutAdmin();
  redirect("/admin/login");
}

async function save(update: (s: CatalogSettings) => void) {
  await assertAdmin();
  const s = structuredClone(readSettings());
  update(s);
  writeSettings(s);
  revalidatePath("/", "layout");
}

/** "15" or "15%" → 1.15; empty → undefined (inherit). Anything outside 0–300 % is ignored. */
function parsePercent(v: FormDataEntryValue | null): number | undefined {
  const n = parseFloat(String(v ?? "").replace("%", "").replace(",", ".").trim());
  return Number.isFinite(n) && n >= 0 && n <= 300 ? Math.round((1 + n / 100) * 10000) / 10000 : undefined;
}

function parseMoney(v: FormDataEntryValue | null): number | undefined {
  const n = parseFloat(String(v ?? "").replace("£", "").replace(",", ".").trim());
  return Number.isFinite(n) && n >= 0 && n < 100000 ? Math.round(n * 100) : undefined;
}

const toggle = (list: string[], item: string, on: boolean) => (on ? [...new Set([...list, item])] : list.filter((x) => x !== item));

export async function setSourceHidden(source: string, hidden: boolean) {
  await save((s) => void (s.hiddenSources = toggle(s.hiddenSources, source, hidden)));
}

export async function setProductHidden(id: string, hidden: boolean) {
  await save((s) => void (s.hiddenProducts = toggle(s.hiddenProducts, id, hidden)));
}

export async function setPhotoHidden(src: string, hidden: boolean) {
  await save((s) => void (s.hiddenPhotos = toggle(s.hiddenPhotos, src, hidden)));
}

export async function saveMarkups(form: FormData) {
  await save((s) => {
    s.markup.default = parsePercent(form.get("default")) ?? s.markup.default;
    s.markup.byCategory = {};
    for (const c of Object.keys(CATEGORY_LABELS) as Category[]) {
      const v = parsePercent(form.get(`category:${c}`));
      if (v !== undefined) s.markup.byCategory[c] = v;
    }
    const byBrand: Record<string, number> = {};
    for (const [key, value] of form.entries()) {
      if (!key.startsWith("brand:")) continue;
      const v = parsePercent(value);
      if (v !== undefined) byBrand[key.slice(6)] = v;
    }
    // Brands not on the form (another page of the list) keep their markup.
    for (const b of Object.keys(s.markup.byBrand)) if (!form.has(`brand:${b}`)) byBrand[b] = s.markup.byBrand[b];
    s.markup.byBrand = byBrand;
  });
}

export async function saveRates(form: FormData) {
  await save((s) => {
    for (const code of ["EUR", "USD"] as const) {
      const n = parseFloat(String(form.get(code) ?? "").replace(",", "."));
      if (Number.isFinite(n) && n > 0.1 && n < 10) s.rates[code] = Math.round(n * 10000) / 10000;
    }
  });
}

export async function saveDeliveryCost(form: FormData) {
  await save((s) => {
    const t = s.delivery.ourCostTiers;
    const a = parseMoney(form.get("tier0"));
    const b = parseMoney(form.get("tier1"));
    const c = parseMoney(form.get("tier2"));
    if (a !== undefined) t[0].price = a;
    if (b !== undefined) t[1].price = b;
    if (c !== undefined) t[2].price = c;
    const customer = parseMoney(form.get("customerPrice"));
    if (customer !== undefined) s.delivery.customerPrice = customer;
  });
}

export async function setRewriteApproved(on: boolean) {
  await save((s) => void (s.rewriteApproved = on));
}

export async function changeOrderStatus(number: string, form: FormData) {
  await assertAdmin();
  const o = getOrder(number);
  const status = String(form.get("status")) as OrderStatus;
  if (!o || !ORDER_STATUSES.includes(status)) return;
  // "Paid" comes only from a verified payment notification, never from a click.
  if (status === "Paid" || (o.status === "Awaiting payment" && status !== "Cancelled")) return;
  setOrderStatus(o.id, status, String(form.get("note") ?? "").slice(0, 300), "admin");
  revalidatePath(`/admin/orders/${number}`);
}
