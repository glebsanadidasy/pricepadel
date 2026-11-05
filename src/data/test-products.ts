import type { Product, Variant } from "@/lib/catalog-types";

/**
 * TEST DATA for the design preview — the product slider of the Figma mockup (names and GBP prices as shown there).
 * Every entry is `isTest: true`, so the catalogue only shows them in preview mode (see lib/catalog.ts).
 * Sizes and colour swatches are placeholders to demonstrate variant selection; they are not real stock.
 */
function variants(slug: string, colours: string[], sizes: string[], price: number): Variant[] {
  if (sizes.length === 0) return colours.map((colour) => ({ sku: `${slug}-${colour}`.toLowerCase().replace(/\s+/g, "-"), colour, price }));
  return colours.flatMap((colour) => sizes.map((size) => ({ sku: `${slug}-${colour}-${size}`.toLowerCase().replace(/[\s.]+/g, "-"), colour, size, price })));
}

const SHOE_SIZES_MEN = ["UK 7", "UK 8", "UK 9", "UK 10", "UK 11"];
const SHOE_SIZES_WOMEN = ["UK 4", "UK 5", "UK 6", "UK 7", "UK 8"];

function product(p: Omit<Product, "id" | "variants" | "isTest">): Product {
  return { ...p, id: p.slug, variants: variants(p.slug, p.colours.map((c) => c.name), p.sizes, p.price), isTest: true };
}

export const TEST_PRODUCTS: Product[] = [
  product({
    slug: "asics-womens-game-ff-padel-shoes-guava-white",
    name: "Asics Women’s Game FF Padel Shoes Guava White",
    brand: "Asics",
    category: "shoes",
    audience: "women",
    price: 7899,
    images: [],
    colours: [{ name: "Guava White", swatch: "#f3d6cf" }],
    sizes: SHOE_SIZES_WOMEN,
  }),
  product({
    slug: "asics-mens-game-ff-padel-shoes-white-misty-pine",
    name: "Asics Men’s Game FF Padel Shoes White Misty Pine",
    brand: "Asics",
    category: "shoes",
    audience: "men",
    price: 7899,
    images: [{ src: "/images/test-products/p4-a.png", alt: "Asics padel shoes, white with pine green" }],
    colours: [{ name: "White Misty Pine", swatch: "#0f6e6a" }],
    sizes: SHOE_SIZES_MEN,
  }),
  product({
    slug: "wilson-carbon-force-lt-padel-racket",
    name: "Wilson Carbon Force LT Padel Racket",
    brand: "Wilson",
    category: "rackets",
    audience: "unisex",
    price: 13099,
    images: [{ src: "/images/test-products/p2-a.jpg", alt: "Wilson Carbon Force LT padel racket" }],
    colours: [{ name: "Grey", swatch: "#6b6f76" }],
    sizes: [],
  }),
  product({
    slug: "nox-at10-genius-12k-agustin-tapia-padel-racket-2025",
    name: "Nox AT10 Genius 12k Agustin Tapia Padel Racket 2025",
    brand: "Nox",
    category: "rackets",
    audience: "unisex",
    price: 23599,
    images: [{ src: "/images/test-products/p3-a.jpg", alt: "Nox AT10 Genius 12k padel racket" }],
    colours: [{ name: "Black Red", swatch: "#3a3d44" }],
    sizes: [],
  }),
  product({
    slug: "bullpadel-womens-pearl-vibram-26v-padel-shoes-lilac",
    name: "Bullpadel Women’s Pearl Vibram 26V Padel Shoes Lilac",
    brand: "Bullpadel",
    category: "shoes",
    audience: "women",
    price: 14399,
    images: [],
    colours: [{ name: "Lilac", swatch: "#c7b3e3" }],
    sizes: SHOE_SIZES_WOMEN,
  }),
  product({
    slug: "adidas-womens-crazyquick-ls-padel-shoes-white-metallic",
    name: "Adidas Women’s Crazyquick LS Padel Shoes White Metallic",
    brand: "Adidas",
    category: "shoes",
    audience: "women",
    price: 9899,
    images: [],
    colours: [{ name: "White Metallic", swatch: "#e9e9ea" }],
    sizes: SHOE_SIZES_WOMEN,
  }),
  product({
    slug: "babolat-mens-jet-premura-2-padel-shoes-25-black-tomato-red",
    name: "Babolat Men’s Jet Premura 2 Padel Shoes 25 Black Tomato Red",
    brand: "Babolat",
    category: "shoes",
    audience: "men",
    price: 7699,
    images: [],
    colours: [{ name: "Black Tomato Red", swatch: "#2b2b2b" }],
    sizes: SHOE_SIZES_MEN,
  }),
  product({
    slug: "babolat-counter-viper-2-5-padel-racket",
    name: "Babolat Counter Viper 2.5 Padel Racket",
    brand: "Babolat",
    category: "rackets",
    audience: "unisex",
    price: 21399,
    images: [{ src: "/images/test-products/p5-a.png", alt: "Padel racket, black and yellow" }],
    colours: [{ name: "Black Yellow", swatch: "#1d1d1d" }],
    sizes: [],
  }),
  product({
    slug: "bullpadel-mens-indiga-26v-padel-shoes-white",
    name: "Bullpadel Men’s Indiga 26V Padel Shoes White",
    brand: "Bullpadel",
    category: "shoes",
    audience: "men",
    price: 7399,
    images: [
      { src: "/images/test-products/p1-a.jpg", alt: "Bullpadel Indiga padel shoe, side view" },
      { src: "/images/test-products/p1-b.jpg", alt: "Bullpadel Indiga padel shoe, sole" },
    ],
    colours: [
      { name: "White", swatch: "#f2f2f2" },
      { name: "Navy", swatch: "#1f2a44" },
    ],
    sizes: SHOE_SIZES_MEN,
  }),
];
