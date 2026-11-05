/**
 * Public product shape — the only thing pages and customer-facing APIs ever see.
 * Supplier, source shop and source price live in admin-only data and must never be added here.
 */
export type Category = "rackets" | "shoes" | "bags" | "balls" | "apparel" | "accessories";
export type Audience = "men" | "women" | "kids" | "unisex";

export type Variant = {
  sku: string;
  colour: string;
  size?: string;
};

export type Product = {
  slug: string;
  name: string;
  brand: string;
  category: Category;
  audience: Audience;
  /** GBP price in pence. */
  price: number;
  images: { src: string; alt: string }[];
  colours: { name: string; swatch: string }[];
  sizes: string[];
  variants: Variant[];
  description?: string;
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
