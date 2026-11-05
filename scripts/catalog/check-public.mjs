// Checks what a customer's browser receives (HTML incl. the inline React payload) against the catalogue:
//   - no source shop name / domain, source links, source SKUs, source photo names or source prices
//   - every product page checked shows the right retail price (source × markup) and only in-stock sizes
//   - hidden products answer 404
// Needs a running site:  node scripts/catalog/check-public.mjs [baseUrl] [--sample N]
import { CATALOG_FILE, offersFile, readJson, SETTINGS_FILE, SOURCE } from "./lib/store.mjs";

const args = process.argv.slice(2);
const BASE = args.find((a) => a.startsWith("http")) || "http://localhost:3100";
const SAMPLE = Number(args[args.indexOf("--sample") + 1]) || Infinity;
const items = readJson(CATALOG_FILE, []);
const offers = readJson(offersFile(SOURCE.id), {});
const settings = readJson(SETTINGS_FILE, {});
const markupFor = (p) => settings.markup?.byBrand?.[p.brand] ?? settings.markup?.byCategory?.[p.category] ?? settings.markup?.default ?? 1.15;
const gbp = (pence) => `£${(pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const hiddenPhotos = new Set(settings.hiddenPhotos ?? []);
const onSaleCheck = (p) =>
  !p.hidden &&
  !settings.hiddenSources?.includes(p.source) &&
  !settings.hiddenProducts?.includes(p.id) &&
  p.images.some((i) => !hiddenPhotos.has(i.src)) &&
  Object.values(offers[p.id]?.variants ?? {}).some((v) => v.inStock);
const onSale = items.filter(onSaleCheck);

const problems = [];
const GLOBAL_FORBIDDEN = [/nuestro/i, /padelnuestro/i, /media\/catalog\/product/i, /sourcePrice|sourceUrl|sourceSku|sourceVariantId|scrapedAt|priceCheckedAt/];

const get = (path) => fetch(BASE + path).then(async (r) => ({ status: r.status, body: await r.text() }));

function scan(path, body, own = []) {
  for (const re of GLOBAL_FORBIDDEN) if (re.test(body)) problems.push(`${path}: contains ${re}`);
  for (const p of own) {
    const o = offers[p.id];
    if (!o) continue;
    for (const v of Object.values(o.variants)) if (v.sourceSku && v.sourceSku.length > 4 && body.includes(v.sourceSku)) problems.push(`${path}: source SKU ${v.sourceSku}`);
    if (o.sourceSku && body.includes(o.sourceSku)) problems.push(`${path}: source SKU ${o.sourceSku}`);
    for (const ph of Object.values(o.photos ?? {})) {
      const file = ph.sourceUrl.split("/").pop();
      if (body.includes(file)) problems.push(`${path}: source photo name ${file}`);
    }
  }
}

// Pick an even sample across the catalogue when asked (a full night run checks everything).
const step = Math.max(1, Math.floor(onSale.length / Math.min(SAMPLE, onSale.length || 1)));
const toCheck = onSale.filter((_, i) => i % step === 0).slice(0, SAMPLE);

let pages = 0;
for (const path of ["/", "/shop", "/shop?category=shoes", "/cart"]) {
  scan(path, (await get(path)).body, toCheck.slice(0, 50));
  pages++;
}

for (const p of toCheck) {
  const path = `/product/${p.slug}`;
  const { status, body } = await get(path);
  pages++;
  if (status !== 200) {
    problems.push(`${path}: answers ${status}`);
    continue;
  }
  scan(path, body, [p]);
  const m = markupFor(p);
  const vs = p.variants.map((v) => ({ ...v, ...offers[p.id].variants[v.sku] }));
  const stock = vs.filter((v) => v.inStock);
  const retail = stock.map((v) => Math.round(v.sourcePrice * m));
  for (const r of new Set(retail)) if (!body.includes(gbp(r))) problems.push(`${path}: retail price ${gbp(r)} not shown`);
  // A source price must not appear unless it happens to equal a retail price on the page.
  for (const v of vs) {
    const s = gbp(v.sourcePrice);
    if (body.includes(s) && !retail.some((r) => gbp(r) === s)) problems.push(`${path}: source price ${s} visible`);
  }
  for (const v of vs.filter((x) => !x.inStock && x.size)) {
    if (!stock.some((x) => x.size === v.size) && (body.includes(`>${v.size}<`) || (v.size.length > 3 && body.includes(`"${v.size}"`)))) problems.push(`${path}: out-of-stock size ${v.size} shown`);
  }
}

// Products not on sale must not be reachable (sampled).
for (const p of items.filter((x) => !onSaleCheck(x)).slice(0, 100)) {
  const res = await fetch(`${BASE}/product/${p.slug}`);
  pages++;
  if (res.status !== 404) problems.push(`/product/${p.slug}: product not on sale answers ${res.status}`);
}

console.log(`Checked ${pages} pages (${toCheck.length} of ${onSale.length} products on sale).`);
if (problems.length) {
  console.log(problems.slice(0, 200).join("\n"));
  process.exit(1);
}
console.log("OK: no source data in public pages; prices and sizes match.");
