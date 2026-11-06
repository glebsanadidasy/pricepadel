// Seeds sources/<id>/offers.json from data/catalog/products.json
// Gives every product a realistic source price and puts variants in stock so the entire catalogue is live.
//   node scripts/catalog/seed.mjs
import fs from "node:fs";
import path from "node:path";
import { CATALOG_FILE, offersFile, readJson, SOURCE, SOURCE_REGISTRY_FILE, SOURCES_DIR, writeJson } from "./lib/store.mjs";

const BASE_SOURCE_PENCE = {
  rackets: 9500, // £95.00
  shoes: 5800,   // £58.00
  bags: 4200,    // £42.00
  apparel: 2800,  // £28.00
  balls: 1400,   // £14.00
  accessories: 1100, // £11.00
};

function main() {
  const products = readJson(CATALOG_FILE, []);
  if (products.length === 0) {
    console.error("No products found in data/catalog/products.json");
    process.exit(1);
  }

  // Registry
  writeJson(SOURCE_REGISTRY_FILE, {
    [SOURCE.id]: { name: SOURCE.name, url: SOURCE.url },
  });

  const now = new Date().toISOString();
  const file = offersFile(SOURCE.id);
  const existing = readJson(file, {});
  const offers = { ...existing };

  let count = 0;
  for (const p of products) {
    const basePrice = BASE_SOURCE_PENCE[p.category] ?? 3000;
    const variants = {};

    for (let i = 0; i < p.variants.length; i++) {
      const v = p.variants[i];
      // Keep existing price if present, otherwise base price
      const prev = existing[p.id]?.variants?.[v.sku];
      variants[v.sku] = {
        sourcePrice: prev?.sourcePrice ?? basePrice,
        inStock: true,
        sourceSku: v.sku,
        sourceVariantId: null,
      };
    }

    offers[p.id] = {
      sourceUrl: existing[p.id]?.sourceUrl ?? `${SOURCE.url}product/${p.slug}`,
      sourceSku: existing[p.id]?.sourceSku ?? p.id,
      scrapedAt: existing[p.id]?.scrapedAt ?? now,
      priceCheckedAt: now,
      variants,
      photos: existing[p.id]?.photos ?? {},
    };
    count++;
  }

  writeJson(file, offers);
  console.log(`Successfully seeded ${count} products into ${file}!`);
}

main();
