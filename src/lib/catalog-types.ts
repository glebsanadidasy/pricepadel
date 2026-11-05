/**
 * Public product shape — the only thing pages and customer-facing APIs ever see.
 * Supplier, source shop and source price live in admin-only data and must never be added here.
 */
export type Category = "rackets" | "shoes" | "bags" | "balls" | "apparel" | "accessories";
export type Audience = "men" | "women" | "kids" | "unisex";

/** One buyable option. Only in-stock variants ever reach a page. */
export type Variant = {
  sku: string;
  /** Empty when the product has no colour choice. */
  colour: string;
  size?: string;
  /** Retail GBP price in pence. */
  price: number;
};

export type DescriptionBlock = { type: "heading" | "paragraph"; text: string } | { type: "list"; items: string[] };

export type Product = {
  slug: string;
  name: string;
  brand: string;
  category: Category;
  audience: Audience;
  /** Lowest retail GBP price in pence among the variants. */
  price: number;
  images: { src: string; alt: string }[];
  colours: { name: string; swatch: string }[];
  sizes: string[];
  variants: Variant[];
  /** Manufacturer's product code, when the maker publishes one. */
  mpn?: string;
  specs?: { label: string; value: string }[];
  description?: DescriptionBlock[];
  /** Sample product for the design preview. Never part of the live catalogue. */
  isTest: boolean;
};

export const CATEGORY_LABELS: Record<Category, string> = {
  rackets: "Padel Rackets",
  shoes: "Padel Shoes",
  bags: "Padel Bags",
  balls: "Padel Balls",
  apparel: "Apparel",
  accessories: "Accessories",
};

export const AUDIENCE_LABELS: Record<Audience, string> = {
  men: "Men",
  women: "Women",
  kids: "Kids",
  unisex: "Unisex",
};
