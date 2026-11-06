import "server-only";
import { TEST_PRODUCTS } from "@/data/test-products";
import { markupFor, offSaleReason, readCatalog, readOffers, readSettings, retailPrice, visibleImages, type CatalogProduct, type CatalogSettings, type Offer } from "./catalog-store";
import { CATEGORY_LABELS, AUDIENCE_LABELS, type Audience, type Category, type Product } from "./catalog-types";

/**
 * Test products (from the design mockup) appear only in the local preview (`next dev`) or when SHOW_TEST_PRODUCTS=1 is set,
 * and only while nothing has been imported yet. A production build never shows them.
 */
const TEST_ALLOWED = process.env.NODE_ENV !== "production" || process.env.SHOW_TEST_PRODUCTS === "1";

/**
 * Public shape of a catalogue product. Fields are copied one by one on purpose: source, source link,
 * source price and source SKU must never reach a page, so nothing is spread from the stored records.
 */
function toPublic(p: CatalogProduct, offer: Offer, s: CatalogSettings): Product {
  const markup = markupFor(p, s);
  const onSale = p.variants.filter((v) => offer.variants[v.sku]?.inStock);
  const variants = onSale.map((v) => ({ sku: v.sku, colour: v.colour, size: v.size ?? undefined, price: retailPrice(offer.variants[v.sku].sourcePrice, markup, s.markup.minAmount) }));
  const colours = [...new Map(onSale.filter((v) => v.colour).map((v) => [v.colour, { name: v.colour, swatch: v.colourHex }])).values()];
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    category: p.category,
    audience: p.audience,
    price: Math.min(...variants.map((v) => v.price)),
    images: visibleImages(p, s).map((i) => ({ src: i.src, alt: i.alt, colour: i.colour })),
    colours,
    sizes: [...new Set(onSale.map((v) => v.size).filter((x): x is string => !!x))],
    variants,
    mpn: p.mpn ?? undefined,
    specs: p.specs.map((x) => ({ label: x.label, value: x.value })),
    description: p.description,
    isTest: false,
  };
}

/** The public catalogue, rebuilt only when one of its files changed (readCached returns the same objects otherwise). */
let memo: { catalog: unknown; offers: unknown; settings: CatalogSettings; list: Product[]; bySlug: Map<string, Product>; bySku: Map<string, { product: Product; variant: Product["variants"][number] }> } | null = null;
function live() {
  const catalog = readCatalog();
  const offers = readOffers();
  const settings = readSettings();
  if (memo && memo.catalog === catalog && memo.offers === offers && JSON.stringify(memo.settings) === JSON.stringify(settings)) return memo;
  const list = catalog.filter((p) => offSaleReason(p, offers[p.id], settings) === null).map((p) => toPublic(p, offers[p.id], settings));
  const bySku = new Map(list.flatMap((product) => product.variants.map((variant) => [variant.sku, { product, variant }] as const)));
  memo = { catalog, offers, settings, list, bySlug: new Map(list.map((p) => [p.slug, p])), bySku };
  return memo;
}

function liveProducts(): Product[] {
  return live().list;
}

/** True while the shop is showing the mockup's sample products instead of a real catalogue. */
export function showingTestProducts() {
  return TEST_ALLOWED && readCatalog().length === 0;
}

function all(): Product[] {
  return showingTestProducts() ? TEST_PRODUCTS : liveProducts();
}

/** A buyable variant (on sale, in stock) with its current retail price — the server's source of truth for carts and orders. */
export function findVariant(sku: string) {
  if (showingTestProducts()) {
    for (const product of TEST_PRODUCTS) for (const variant of product.variants) if (variant.sku === sku) return { product, variant };
    return undefined;
  }
  return live().bySku.get(sku);
}

export function getProductById(id: string) {
  return all().find((p) => p.id === id);
}

export const PRICE_BANDS = [
  { value: "0-50", label: "Under £50", min: 0, max: 5000 },
  { value: "50-100", label: "£50 – £100", min: 5000, max: 10000 },
  { value: "100-200", label: "£100 – £200", min: 10000, max: 20000 },
  { value: "200-", label: "Over £200", min: 20000, max: Infinity },
] as const;

export const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name" },
] as const;

export type Filters = {
  q?: string;
  category: Category[];
  audience: Audience[];
  brand: string[];
  price?: string;
  size: string[];
  sort: (typeof SORTS)[number]["value"];
};

export type RawParams = Record<string, string | string[] | undefined>;
const list = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []).map((s) => s.trim()).filter(Boolean);
const one = (v: string | string[] | undefined) => list(v)[0];

export function parseFilters(p: RawParams): Filters {
  return {
    q: one(p.q)?.slice(0, 80),
    category: list(p.category).filter((c): c is Category => c in CATEGORY_LABELS),
    audience: list(p.for).filter((a): a is Audience => a in AUDIENCE_LABELS),
    brand: list(p.brand),
    price: PRICE_BANDS.find((b) => b.value === one(p.price))?.value,
    size: list(p.size),
    sort: SORTS.find((s) => s.value === one(p.sort))?.value ?? "featured",
  };
}

function matches(p: Product, f: Filters, skip?: keyof Filters) {
  const band = PRICE_BANDS.find((b) => b.value === f.price);
  return (
    (!f.q || `${p.name} ${p.brand}`.toLowerCase().includes(f.q.toLowerCase())) &&
    (skip === "category" || f.category.length === 0 || f.category.includes(p.category)) &&
    (skip === "audience" || f.audience.length === 0 || f.audience.includes(p.audience) || (p.audience === "unisex" && f.audience.some((a) => a === "men" || a === "women"))) &&
    (skip === "brand" || f.brand.length === 0 || f.brand.includes(p.brand)) &&
    (skip === "price" || !band || (p.price >= band.min && p.price < band.max)) &&
    (skip === "size" || f.size.length === 0 || p.sizes.some((s) => f.size.includes(s)))
  );
}

export function listProducts(f: Filters) {
  const items = all().filter((p) => matches(p, f));
  if (f.sort === "price-asc") items.sort((a, b) => a.price - b.price);
  if (f.sort === "price-desc") items.sort((a, b) => b.price - a.price);
  if (f.sort === "name") items.sort((a, b) => a.name.localeCompare(b.name));
  return items;
}

/** Options for each filter group, counted against the other active filters. */
export function filterOptions(f: Filters) {
  const count = <T extends string>(skip: keyof Filters, key: (p: Product) => T[]) => {
    const m = new Map<T, number>();
    for (const p of all().filter((x) => matches(x, f, skip))) for (const k of key(p)) m.set(k, (m.get(k) ?? 0) + 1);
    return m;
  };
  return {
    category: count("category", (p) => [p.category]),
    audience: count("audience", (p): Audience[] => (p.audience === "unisex" ? ["men", "women"] : [p.audience])),
    brand: count("brand", (p) => [p.brand]),
    size: count("size", (p) => p.sizes),
    price: count("price", (p) => PRICE_BANDS.filter((b) => p.price >= b.min && p.price < b.max).map((b) => b.value)),
  };
}

export function getProduct(slug: string) {
  return showingTestProducts() ? TEST_PRODUCTS.find((p) => p.slug === slug) : live().bySlug.get(slug);
}

export function featuredProducts(limit = 8) {
  return all().slice(0, limit);
}

/** Real catalogue figures for the "about" counters. Test products never count, so nothing shows until real data exists. */
export function catalogueStats() {
  const live = liveProducts();
  const rackets = live.filter((p) => p.category === "rackets").length;
  const brands = new Set(live.map((p) => p.brand)).size;
  return { rackets, brands };
}

export function relatedProducts(p: Product, limit = 4) {
  return all()
    .filter((x) => x.slug !== p.slug && x.category === p.category)
    .slice(0, limit);
}
