import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Audience, Category, DescriptionBlock } from "./catalog-types";

/**
 * Imported catalogue and its settings, as written by scripts/catalog/import.mjs and the admin panel.
 * These records hold supplier data (source, source link, source price, source SKU): they are for the server
 * and the admin panel only. Public pages get products through lib/catalog.ts, which copies only public fields.
 */
export type ImportedVariant = {
  sku: string;
  colour: string;
  colourHex: string;
  size: string | null;
  inStock: boolean;
  /** Source price in GBP pence, VAT included. */
  sourcePrice: number;
  sourceSku: string | null;
  sourceVariantId: string | null;
};

export type ImportedProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  mpn: string | null;
  category: Category;
  audience: Audience;
  specs: { label: string; value: string }[];
  description: DescriptionBlock[];
  descriptionRewritten: boolean;
  images: { src: string; alt: string; width: number; height: number; source: string; sourceUrl: string; scrapedAt: string }[];
  variants: ImportedVariant[];
  hidden: boolean;
  hiddenReason: string | null;
  source: string;
  sourceUrl: string;
  sourceSku: string;
  scrapedAt: string;
  priceCheckedAt: string;
};

export type DeliveryTier = { below: number | null; price: number };

export type CatalogSettings = {
  markup: { default: number; byCategory: Partial<Record<Category, number>>; byBrand: Record<string, number> };
  delivery: { currency: "GBP"; tiers: DeliveryTier[]; ourCost: number | null; ourCostNote: string };
  rewriteApproved: boolean;
  hiddenSources: string[];
  sources: Record<string, { name: string; url: string }>;
};

const DIR = path.join(process.cwd(), "data", "catalog");
const PRODUCTS_FILE = path.join(DIR, "products.json");
const SETTINGS_FILE = path.join(DIR, "settings.json");

export const DEFAULT_SETTINGS: CatalogSettings = {
  markup: { default: 1.15, byCategory: {}, byBrand: {} },
  delivery: {
    currency: "GBP",
    tiers: [
      { below: 8500, price: 1295 },
      { below: 17000, price: 695 },
      { below: null, price: 0 },
    ],
    ourCost: null,
    ourCostNote: "",
  },
  rewriteApproved: false,
  hiddenSources: [],
  sources: {},
};

/** Re-read a JSON file only when it changes on disk (the import script and admin actions write it). */
const cache = new Map<string, { mtime: number; value: unknown }>();
function readCached<T>(file: string, fallback: T): T {
  let mtime: number;
  try {
    mtime = fs.statSync(file).mtimeMs;
  } catch {
    return fallback;
  }
  const hit = cache.get(file);
  if (hit && hit.mtime === mtime) return hit.value as T;
  const value = JSON.parse(fs.readFileSync(file, "utf8")) as T;
  cache.set(file, { mtime, value });
  return value;
}

export function readImported(): ImportedProduct[] {
  return readCached<ImportedProduct[]>(PRODUCTS_FILE, []);
}

export function readSettings(): CatalogSettings {
  const s = readCached<Partial<CatalogSettings>>(SETTINGS_FILE, {});
  return { ...DEFAULT_SETTINGS, ...s, markup: { ...DEFAULT_SETTINGS.markup, ...s.markup }, delivery: { ...DEFAULT_SETTINGS.delivery, ...s.delivery } };
}

export function writeSettings(next: CatalogSettings) {
  const tmp = `${SETTINGS_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(next, null, 2) + "\n");
  fs.renameSync(tmp, SETTINGS_FILE);
}

/** Brand markup wins over category markup, which wins over the default. */
export function markupFor(p: Pick<ImportedProduct, "brand" | "category">, s: CatalogSettings) {
  return s.markup.byBrand[p.brand] ?? s.markup.byCategory[p.category] ?? s.markup.default;
}

/** Retail GBP pence = source price × markup, rounded to the penny. */
export function retailPrice(sourcePence: number, markup: number) {
  return Math.round(sourcePence * markup);
}

/** Why a product is not on sale, or null when it is. */
export function offSaleReason(p: ImportedProduct, s: CatalogSettings): string | null {
  if (s.hiddenSources.includes(p.source)) return "source hidden";
  if (p.hidden) return p.hiddenReason ?? "hidden";
  if (p.images.length === 0) return "no photo";
  if (!p.variants.some((v) => v.inStock)) return "out of stock";
  return null;
}
