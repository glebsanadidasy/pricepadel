"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin";
import { readSettings, writeSettings, type CatalogSettings } from "@/lib/catalog-store";
import { CATEGORY_LABELS, type Category } from "@/lib/catalog-types";

function save(update: (s: CatalogSettings) => void) {
  assertAdmin();
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

export async function setSourceHidden(source: string, hidden: boolean) {
  save((s) => {
    s.hiddenSources = hidden ? [...new Set([...s.hiddenSources, source])] : s.hiddenSources.filter((x) => x !== source);
  });
}

export async function saveMarkups(form: FormData) {
  save((s) => {
    s.markup.default = parsePercent(form.get("default")) ?? s.markup.default;
    s.markup.byCategory = {};
    for (const c of Object.keys(CATEGORY_LABELS) as Category[]) {
      const v = parsePercent(form.get(`category:${c}`));
      if (v !== undefined) s.markup.byCategory[c] = v;
    }
    s.markup.byBrand = {};
    for (const [key, value] of form.entries()) {
      if (!key.startsWith("brand:")) continue;
      const v = parsePercent(value);
      if (v !== undefined) s.markup.byBrand[key.slice(6)] = v;
    }
  });
}

export async function saveOurDeliveryCost(form: FormData) {
  save((s) => {
    const n = parseFloat(String(form.get("ourCost") ?? "").replace(",", "."));
    s.delivery.ourCost = Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
    s.delivery.ourCostNote = String(form.get("ourCostNote") ?? "").slice(0, 300);
  });
}

export async function setRewriteApproved(on: boolean) {
  save((s) => {
    s.rewriteApproved = on;
  });
}
