// Margin check: every product on sale bought alone as a single-item order, before taxes.
//   node scripts/catalog/margins.mjs   → prints a summary, writes sources/margins.json (admin data, not in Git)
// profit        = retail + delivery the customer pays − source price − our delivery cost (tier by the order's value at the source)
// profit after fee = profit − card fee, where the fee is an assumption from the admin settings (default 3 % of the amount paid).
// Retail follows the shop's rule: the larger of source × markup and source + minimum markup (lib/pricing.mjs).
import path from "node:path";
import { retailFor } from "./lib/pricing.mjs";
import { CATALOG_FILE, offersFile, readJson, SETTINGS_FILE, SOURCE, SOURCES_DIR, writeJson } from "./lib/store.mjs";

const items = readJson(CATALOG_FILE, []);
const offers = readJson(offersFile(SOURCE.id), {});
const s = readJson(SETTINGS_FILE, {});
const tiers = s.delivery?.ourCostTiers ?? [];
const hiddenPhotos = new Set(s.hiddenPhotos ?? []);
const feePct = s.assumptions?.gatewayFeePct ?? 3;
const customer = s.delivery?.customer ?? { price: 0, freeFrom: 0 };
const customerDelivery = (retail) => (retail >= customer.freeFrom ? 0 : customer.price);
const deliveryCost = (sub) => (tiers.find((t) => t.below === null || sub < t.below) ?? tiers[tiers.length - 1])?.price ?? 0;

const rows = [];
for (const p of items) {
  const o = offers[p.id];
  if (!o || p.hidden || s.hiddenSources?.includes(p.source) || s.hiddenProducts?.includes(p.id) || !p.images.some((i) => !hiddenPhotos.has(i.src))) continue;
  const stock = p.variants.map((v) => o.variants[v.sku]).filter((v) => v?.inStock);
  if (!stock.length) continue;
  const source = Math.min(...stock.map((v) => v.sourcePrice)); // the cheapest option, as a customer would see "from"
  const retail = retailFor(p, source, s);
  const paid = customerDelivery(retail);
  const delivery = deliveryCost(source);
  const profit = retail + paid - source - delivery;
  const fee = Math.round(((retail + paid) * feePct) / 100);
  rows.push({ id: p.id, name: p.name, category: p.category, source, retail, customerDelivery: paid, delivery, profit, fee, profitAfterFee: profit - fee });
}

const avg = (xs) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
const stats = (list) => ({
  products: list.length,
  losing: list.filter((r) => r.profit < 0).length,
  underTwo: list.filter((r) => r.profit < 200).length,
  averageProfit: avg(list.map((r) => r.profit)),
  losingAfterFee: list.filter((r) => r.profitAfterFee < 0).length,
  underTwoAfterFee: list.filter((r) => r.profitAfterFee < 200).length,
  averageAfterFee: avg(list.map((r) => r.profitAfterFee)),
});
const byCategory = {};
for (const c of [...new Set(rows.map((r) => r.category))]) byCategory[c] = stats(rows.filter((r) => r.category === c));
const summary = {
  at: new Date().toISOString(),
  rule: { markup: s.markup?.default, minAmount: s.markup?.minAmount, feePct },
  terms: { customerDelivery: customer, ourCostTiers: tiers },
  total: stats(rows),
  byCategory,
  worstAfterFee: [...rows].sort((a, b) => a.profitAfterFee - b.profitAfterFee).slice(0, 10),
};
writeJson(path.join(SOURCES_DIR, "margins.json"), { summary, rows });
const gbp = (p) => `£${(p / 100).toFixed(2)}`;
const line = (name, v) =>
  `${name.padEnd(12)} ${String(v.products).padStart(4)} | lose ${String(v.losing).padStart(3)}  <£2 ${String(v.underTwo).padStart(3)}  avg ${gbp(v.averageProfit).padStart(7)} | after ${feePct}% fee: lose ${String(v.losingAfterFee).padStart(3)}  <£2 ${String(v.underTwoAfterFee).padStart(3)}  avg ${gbp(v.averageAfterFee).padStart(7)}`;
for (const [c, v] of Object.entries(byCategory)) console.log(line(c, v));
console.log(line("TOTAL", summary.total));
