import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Audience, Category, DescriptionBlock } from "./catalog-types";

/**
 * Catalogue files written by scripts/catalog/import.mjs and the admin panel.
 *   data/catalog/products.json   public product data (in Git)
 *   data/catalog/settings.json   markups, exchange rates, delivery cost, hidden sources / products / photos (in Git)
 *   sources/<id>/offers.json     supplier data: source link, source price, stock, source SKUs (never in Git)
 * Supplier data is for the server and the admin panel only. Public pages get products through lib/catalog.ts,
 * which copies only public fields.
 */
export type CatalogImage = { src: string; alt: string; width: number; height: number; colour: string | null };

export type CatalogProduct = {
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
  images: CatalogImage[];
  variants: { sku: string; colour: string; colourHex: string; size: string | null }[];
  /** Hidden by the import (e.g. no usable photo). */
  hidden: boolean;
  hiddenReason: string | null;
  source: string;
  collectedAt: string;
};

export type OfferVariant = { sourcePrice: number; inStock: boolean; sourceSku: string | null; sourceVariantId: string | null };
export type Offer = {
  sourceUrl: string;
  sourceSku: string;
  scrapedAt: string;
  priceCheckedAt: string;
  variants: Record<string, OfferVariant>;
  photos: Record<string, { sourceUrl: string; scrapedAt: string }>;
};

export type DeliveryTier = { below: number | null; price: number };
export type FxEntry = { ecb: number | null; ecbDate: string | null; manual: number | null; manualAt: string | null };
/** Exchange rates (see lib/fx.ts): 1 GBP in EUR / USD. */
export type FxSettings = { marginPct: number; fetchedAt?: string | null; lastError?: string | null; EUR: FxEntry; USD: FxEntry };

export type CatalogSettings = {
  markup: { default: number; byCategory: Partial<Record<Category, number>>; byBrand: Record<string, number> };
  /**
   * Customer delivery: `price` (pence) for orders below `freeFrom` (pence), free from it; `countries` we deliver to.
   * `ourCostTiers`: what delivery costs us, by the order's value at the source.
   */
  delivery: { customer: { price: number; freeFrom: number }; countries: string[]; ourCostTiers: DeliveryTier[] };
  fx: FxSettings;
  rewriteApproved: boolean;
  hiddenSources: string[];
  hiddenProducts: string[];
  hiddenPhotos: string[];
};

const ROOT = process.cwd();
const CATALOG_DIR = path.resolve(process.env.CATALOG_DIR || path.join(ROOT, "data", "catalog"));
const SOURCES_DIR = path.resolve(process.env.SOURCES_DIR || path.join(ROOT, "sources"));
const PRODUCTS_FILE = path.join(CATALOG_DIR, "products.json");
const SETTINGS_FILE = path.join(CATALOG_DIR, "settings.json");

export const DEFAULT_SETTINGS: CatalogSettings = {
  markup: { default: 1.15, byCategory: {}, byBrand: {} },
  delivery: {
    customer: { price: 1295, freeFrom: 10000 },
    countries: ["GB"],
    ourCostTiers: [
      { below: 8500, price: 1295 },
      { below: 17000, price: 695 },
      { below: null, price: 0 },
    ],
  },
  fx: {
    marginPct: 2,
    EUR: { ecb: null, ecbDate: null, manual: null, manualAt: null },
    USD: { ecb: null, ecbDate: null, manual: null, manualAt: null },
  },
  rewriteApproved: false,
  hiddenSources: [],
  hiddenProducts: [],
  hiddenPhotos: [],
};

/** Re-read a JSON file only when it changes on disk (the import script and admin actions write these files). */
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
  try {
    const value = JSON.parse(fs.readFileSync(file, "utf8")) as T;
    cache.set(file, { mtime, value });
    return value;
  } catch {
    // Being rewritten right now: keep serving the previous copy.
    return (hit?.value as T) ?? fallback;
  }
}

function writeJson(file: string, data: unknown) {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n");
  fs.renameSync(tmp, file);
}

export function readCatalog(): CatalogProduct[] {
  return readCached<CatalogProduct[]>(PRODUCTS_FILE, []);
}

/** All sources' offers, by product id. */
export function readOffers(): Record<string, Offer> {
  let dirs: string[] = [];
  try {
    dirs = fs.readdirSync(SOURCES_DIR, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  } catch {
    return {};
  }
  if (dirs.length === 1) return readCached<Record<string, Offer>>(path.join(SOURCES_DIR, dirs[0], "offers.json"), {});
  return Object.assign({}, ...dirs.map((d) => readCached<Record<string, Offer>>(path.join(SOURCES_DIR, d, "offers.json"), {})));
}

export function readSourceRegistry(): Record<string, { name: string; url: string }> {
  return readCached(path.join(SOURCES_DIR, "sources.json"), {});
}

export function readSettings(): CatalogSettings {
  const s = readCached<Partial<CatalogSettings>>(SETTINGS_FILE, {});
  return {
    ...DEFAULT_SETTINGS,
    ...s,
    markup: { ...DEFAULT_SETTINGS.markup, ...s.markup },
    delivery: { ...DEFAULT_SETTINGS.delivery, ...s.delivery, customer: { ...DEFAULT_SETTINGS.delivery.customer, ...s.delivery?.customer } },
    fx: { ...DEFAULT_SETTINGS.fx, ...s.fx, EUR: { ...DEFAULT_SETTINGS.fx.EUR, ...s.fx?.EUR }, USD: { ...DEFAULT_SETTINGS.fx.USD, ...s.fx?.USD } },
  };
}

export function writeSettings(next: CatalogSettings) {
  writeJson(SETTINGS_FILE, next);
}

/** Brand markup wins over category markup, which wins over the default. */
export function markupFor(p: Pick<CatalogProduct, "brand" | "category">, s: CatalogSettings) {
  return s.markup.byBrand[p.brand] ?? s.markup.byCategory[p.category] ?? s.markup.default;
}

/** Retail GBP pence = source price × markup, rounded to the penny. */
export function retailPrice(sourcePence: number, markup: number) {
  return Math.round(sourcePence * markup);
}

/** What the customer pays for delivery of an order with this subtotal (GBP pence). */
export function customerDelivery(subtotal: number, s: CatalogSettings) {
  return subtotal >= s.delivery.customer.freeFrom ? 0 : s.delivery.customer.price;
}

/** What delivery of an order costs us (GBP pence), by the order's value at the source. */
export function ourDeliveryCost(sourceSubtotal: number, tiers: DeliveryTier[]) {
  return (tiers.find((t) => t.below === null || sourceSubtotal < t.below) ?? tiers[tiers.length - 1]).price;
}

export function visibleImages(p: CatalogProduct, s: CatalogSettings) {
  return p.images.filter((i) => !s.hiddenPhotos.includes(i.src));
}

/** Why a product is not on sale, or null when it is. */
export function offSaleReason(p: CatalogProduct, offer: Offer | undefined, s: CatalogSettings): string | null {
  if (s.hiddenSources.includes(p.source)) return "source hidden";
  if (s.hiddenProducts.includes(p.id)) return "hidden in admin";
  if (p.hidden) return p.hiddenReason ?? "hidden";
  if (!offer) return "no price";
  if (visibleImages(p, s).length === 0) return "no photo";
  if (!p.variants.some((v) => offer.variants[v.sku]?.inStock)) return "out of stock";
  return null;
}
