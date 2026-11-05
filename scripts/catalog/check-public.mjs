// Checks what a customer's browser receives (HTML + React payload) against the imported catalogue:
//   - no source shop name / domain, source links, source SKUs, source photo names or source prices
//   - every on-sale product page shows the right retail price (source × markup) and only in-stock sizes
// Needs the preview running: npm run dev, then  node scripts/catalog/check-public.mjs [baseUrl]
import { CATALOG_FILE, readJson, SETTINGS_FILE } from "./lib/store.mjs";

const BASE = process.argv[2] || "http://localhost:3100";
const items = readJson(CATALOG_FILE, []);
const settings = readJson(SETTINGS_FILE, {});
const markupFor = (p) => settings.markup?.byBrand?.[p.brand] ?? settings.markup?.byCategory?.[p.category] ?? settings.markup?.default ?? 1.15;
const gbp = (pence) => `£${(pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const onSale = items.filter((p) => !p.hidden && !settings.hiddenSources?.includes(p.source) && p.images.length && p.variants.some((v) => v.inStock));

const problems = [];
const GLOBAL_FORBIDDEN = [/nuestro/i, /padelnuestro/i, /media\/catalog\/product/i, /sourcePrice|sourceUrl|sourceSku|scrapedAt|priceCheckedAt/];

async function get(path) {
  // RSC=1 asks for the React payload a client-side navigation would receive.
  const [html, rsc] = await Promise.all([
    fetch(BASE + path).then((r) => r.text()),
    fetch(BASE + path, { headers: { RSC: "1" } }).then((r) => r.text()),
  ]);
  return html + "\n" + rsc;
}

function scan(path, body, own = []) {
  for (const re of GLOBAL_FORBIDDEN) if (re.test(body)) problems.push(`${path}: contains ${re}`);
  for (const p of own) {
    for (const v of p.variants) {
      if (v.sourceSku && body.includes(v.sourceSku)) problems.push(`${path}: source SKU ${v.sourceSku}`);
    }
    if (p.sourceSku && body.includes(p.sourceSku)) problems.push(`${path}: source SKU ${p.sourceSku}`);
    for (const img of p.images) {
      const file = img.sourceUrl.split("/").pop();
      if (body.includes(file)) problems.push(`${path}: source photo name ${file}`);
    }
  }
}

let pages = 0;
for (const path of ["/", "/shop", "/shop?category=shoes", "/cart"]) {
  scan(path, await get(path), onSale);
  pages++;
}

for (const p of onSale) {
  const path = `/product/${p.slug}`;
  const body = await get(path);
  pages++;
  scan(path, body, [p]);
  const m = markupFor(p);
  const stock = p.variants.filter((v) => v.inStock);
  const retail = stock.map((v) => Math.round(v.sourcePrice * m));
  for (const r of new Set(retail)) if (!body.includes(gbp(r))) problems.push(`${path}: retail price ${gbp(r)} not shown`);
  // A source price must not appear unless it happens to equal a retail price on the page.
  for (const v of p.variants) {
    const s = gbp(v.sourcePrice);
    if (body.includes(s) && !retail.some((r) => gbp(r) === s)) problems.push(`${path}: source price ${s} visible`);
  }
  for (const v of p.variants.filter((x) => !x.inStock && x.size)) {
    if (!stock.some((x) => x.size === v.size) && (body.includes(`>${v.size}<`) || (v.size.length > 3 && body.includes(`"${v.size}"`)))) problems.push(`${path}: out-of-stock size ${v.size} shown`);
  }
}

// Hidden products must not be reachable.
for (const p of items.filter((x) => !onSale.includes(x))) {
  const res = await fetch(`${BASE}/product/${p.slug}`);
  pages++;
  if (res.status !== 404) problems.push(`/product/${p.slug}: hidden product answers ${res.status}`);
}

console.log(`Checked ${pages} pages, ${onSale.length} products on sale.`);
if (problems.length) {
  console.log(problems.join("\n"));
  process.exit(1);
}
console.log("OK: no source data in public pages; prices and sizes match.");
