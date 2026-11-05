// Margin check with free delivery: every product on sale bought alone as a single-item order.
//   node scripts/catalog/margins.mjs   → prints a summary, writes sources/margins.json (admin data, not in Git)
// profit = retail price − source price − our delivery cost (tier by the order's value at the source).
// Card / payment-gateway fees are not known yet and are not included.
import path from "node:path";
import { CATALOG_FILE, offersFile, readJson, SETTINGS_FILE, SOURCE, SOURCES_DIR, writeJson } from "./lib/store.mjs";

const items = readJson(CATALOG_FILE, []);
const offers = readJson(offersFile(SOURCE.id), {});
const s = readJson(SETTINGS_FILE, {});
const tiers = s.delivery?.ourCostTiers ?? [];
const hiddenPhotos = new Set(s.hiddenPhotos ?? []);
const markupFor = (p) => s.markup?.byBrand?.[p.brand] ?? s.markup?.byCategory?.[p.category] ?? s.markup?.default ?? 1.15;
const deliveryCost = (sub) => (tiers.find((t) => t.below === null || sub < t.below) ?? tiers[tiers.length - 1])?.price ?? 0;

const rows = [];
for (const p of items) {
  const o = offers[p.id];
  if (!o || p.hidden || s.hiddenSources?.includes(p.source) || s.hiddenProducts?.includes(p.id) || !p.images.some((i) => !hiddenPhotos.has(i.src))) continue;
  const stock = p.variants.map((v) => o.variants[v.sku]).filter((v) => v?.inStock);
  if (!stock.length) continue;
  const source = Math.min(...stock.map((v) => v.sourcePrice)); // the cheapest option, as a customer would see "from"
  const retail = Math.round(source * markupFor(p));
  const delivery = deliveryCost(source);
  rows.push({ id: p.id, name: p.name, category: p.category, source, retail, delivery, profit: retail - source - delivery });
}

const losing = rows.filter((r) => r.profit < 0);
const avg = (xs) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
const byCategory = {};
for (const r of rows) {
  const c = (byCategory[r.category] ??= { products: 0, losing: 0, profits: [] });
  c.products++;
  if (r.profit < 0) c.losing++;
  c.profits.push(r.profit);
}
const summary = {
  at: new Date().toISOString(),
  onSale: rows.length,
  losing: losing.length,
  averageProfit: avg(rows.map((r) => r.profit)),
  averageProfitOfProfitable: avg(rows.filter((r) => r.profit >= 0).map((r) => r.profit)),
  breakEvenSourcePrice: "≈ £86.33 (below £85 every single-item order loses money at 15 % markup)",
  byCategory: Object.fromEntries(Object.entries(byCategory).map(([c, v]) => [c, { products: v.products, losing: v.losing, averageProfit: avg(v.profits) }])),
  worst: [...rows].sort((a, b) => a.profit - b.profit).slice(0, 10),
};
writeJson(path.join(SOURCES_DIR, "margins.json"), { summary, rows });
const gbp = (p) => `£${(p / 100).toFixed(2)}`;
console.log(`On sale: ${rows.length}; losing money as a single-item order: ${losing.length}; average profit per single-item order: ${gbp(summary.averageProfit)}`);
for (const [c, v] of Object.entries(summary.byCategory)) console.log(`  ${c}: ${v.products} products, ${v.losing} losing, average ${gbp(v.averageProfit)}`);
