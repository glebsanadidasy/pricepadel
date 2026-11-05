// Catalogue collector for the Padel Nuestro UK store.
//   node scripts/catalog/collect.mjs --limit 60      sample: up to 60 in-stock products, spread evenly over the 6 categories
//   node scripts/catalog/collect.mjs --limit 0       everything in the sitemap
// Resumes from .source-data/state.json. Stops (exit code 2) on a block, captcha, HTTP 403 or 429.
import fs from "node:fs";
import path from "node:path";
import { fetchImage, fetchPage, fetchText, loadRobots, ORIGIN, saveStop, stats, StopError } from "./lib/http.mjs";
import { audienceOf, classify, parseProductPage } from "./lib/parse.mjs";
import { ORIGINALS_DIR, RAW_DIR, readJson, recordFile, SOURCE, STATE_FILE, writeJson } from "./lib/store.mjs";

const SITEMAP_URL = `${ORIGIN}/uk/media/sitemap_uk_product.xml`;
const CATEGORIES = ["rackets", "shoes", "apparel", "bags", "balls", "accessories"];
const MAX_PHOTOS = 5;

const args = process.argv.slice(2);
const argValue = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const LIMIT = Number(argValue("--limit", "60"));
const PER_CATEGORY = LIMIT > 0 ? Math.ceil(LIMIT / CATEGORIES.length) : Infinity;

const state = readJson(STATE_FILE, { source: SOURCE.id, processed: {} });
const saveState = () => writeJson(STATE_FILE, state);

// ---------- sitemap ----------

async function loadSitemap() {
  const file = path.join(RAW_DIR, "sitemap_uk_product.xml");
  const fresh = fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < 24 * 3600 * 1000;
  if (!fresh) {
    fs.writeFileSync(file, await fetchText(SITEMAP_URL));
    state.sitemapFetchedAt = new Date().toISOString();
  }
  const xml = fs.readFileSync(file, "utf8");
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => {
    const block = m[1];
    return {
      url: block.match(/<loc>([^<]+)<\/loc>/)?.[1] ?? "",
      lastmod: block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] ?? "",
      image: block.match(/<image:loc>([^<]+)<\/image:loc>/)?.[1] ?? "",
      title: block.match(/<image:title>([^<]+)<\/image:title>/)?.[1] ?? "",
    };
  }).filter((e) => e.url.startsWith(`${ORIGIN}/uk/`));
}

/** Rough category guess from the URL, photo file name (Spanish words) and title — only to pick a balanced sample. */
function hint(e) {
  const s = `${e.url} ${e.image.split("/").pop()} ${e.title}`.toLowerCase();
  if (/pickleball|beach|gift|regalo|\bpacks?\b|[-_]pack[-_]|duo-pack/.test(s)) return "skip";
  if (/zapatilla|[-_ ]shoes?[-_ ]|sneaker/.test(s)) return "shoes";
  if (/paletero|mochila|backpack|[-_ ]bag[-_ ]|bolsa|trolley|padelbag/.test(s)) return "bags";
  if (/[-_ ]pala[-_ ]|racket/.test(s) && !/cover|funda|protector/.test(s)) return "rackets";
  if (/bote|pelotas|[-_ ]balls?[-_ ]|cajon/.test(s) && !/pick-up|tube|tubo|cesta|basket/.test(s)) return "balls";
  if (/camiseta|t-shirt|polo|pantalon|short|falda|skirt|sudadera|sweatshirt|chaqueta|jacket|vestido|dress|legging|mallas|[-_ ]top[-_ ]/.test(s)) return "apparel";
  if (/overgrip|protector|grip|munequera|wristband|gorra|[-_ ]cap[-_ ]|visera|visor|calcet|sock|headband|toalla|towel/.test(s)) return "accessories";
  return "other";
}

/** Current-season items first: they are the ones most likely to be in stock. */
function score(e) {
  const s = `${e.url} ${e.title}`.toLowerCase();
  return (/2026|[-_ ]26[-_ v]|26v\b/.test(s) ? 2 : 0) + (/2025|[-_ ]25[-_ v]/.test(s) ? 1 : 0);
}

const BRANDS = ["black crown", "drop shot", "star vie", "starvie", "royal padel", "vibor-a", "vibora", "k-swiss", "kswiss", "adidas", "bullpadel", "nox", "head", "babolat", "wilson", "siux", "asics", "dunlop", "lacoste", "mizuno", "softee", "enebe", "joma", "puma", "oxdog", "tecnifibre", "varlion", "munich", "kelme", "hydrogen", "lok", "endless", "jhayber", "j'hayber", "cartri", "kuikma", "osaka", "yonex", "lotto", "drop", "hirostar", "bidi badu", "eye", "alkemia", "wingpadel"];
function brandOf(e) {
  const s = `${e.title} ${e.url.split("/").pop().replace(/-/g, " ")}`.toLowerCase();
  return BRANDS.find((b) => s.includes(b)) ?? "other";
}

/** Round-robin over brands so a small sample is not ten products of one brand. */
function interleaveBrands(list) {
  const groups = new Map();
  for (const e of list) {
    const b = brandOf(e);
    if (!groups.has(b)) groups.set(b, []);
    groups.get(b).push(e);
  }
  const out = [];
  const lists = [...groups.values()];
  for (let i = 0; out.length < list.length; i++) for (const l of lists) if (l[i]) out.push(l[i]);
  return out;
}

// ---------- one product ----------

function keyOf(sku, url) {
  const base = (sku || url.split("/").pop()).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return base || "item";
}

async function downloadPhotos(key, images) {
  const dir = path.join(ORIGINALS_DIR, key);
  fs.mkdirSync(dir, { recursive: true });
  const out = [];
  for (const img of images) {
    if (out.length >= MAX_PHOTOS) break;
    const existing = fs.readdirSync(dir).find((f) => f.startsWith(`${out.length + 1}.`));
    if (existing) {
      out.push({ ...img, file: path.relative(RAW_DIR, path.join(dir, existing)), scrapedAt: img.scrapedAt ?? new Date().toISOString() });
      continue;
    }
    const got = await fetchImage(img.url);
    if (!got) continue;
    const ext = got.type.includes("png") ? "png" : got.type.includes("webp") ? "webp" : "jpg";
    const file = path.join(dir, `${out.length + 1}.${ext}`);
    fs.writeFileSync(file, got.bytes);
    out.push({ ...img, file: path.relative(RAW_DIR, file), bytes: got.bytes.length, scrapedAt: new Date().toISOString() });
  }
  return out;
}

/** Already handled, unless it was only set aside for a full sample or was out of stock more than a week ago. */
function isDone(p) {
  if (!p) return false;
  if (p.status === "deferred") return false;
  if (p.reason === "out of stock" && Date.now() - Date.parse(p.at) > 7 * 24 * 3600 * 1000) return false;
  return true;
}

function acceptedCount(category) {
  return Object.values(state.processed).filter((p) => p.status === "accepted" && p.category === category).length;
}

async function processEntry(e) {
  const page = await fetchPage(e.url);
  const at = new Date().toISOString();
  if (page.status !== 200) return { status: "skipped", reason: page.status === "robots" ? "disallowed by robots.txt" : `HTTP ${page.status}`, at };
  const rec = parseProductPage(page.html, page.url);
  if (!rec) return { status: "skipped", reason: "not a product page", at };
  const category = classify(rec);
  const key = keyOf(rec.sourceSku, page.url);
  const record = { source: SOURCE.id, scrapedAt: at, key, category, audience: audienceOf(rec, category), ...rec };
  writeJson(recordFile(key), record);
  const base = { key, category, at, name: rec.name };
  if (category?.startsWith("excluded:")) return { ...base, status: "skipped", reason: category.slice(9) };
  if (!category) return { ...base, status: "skipped", reason: `unknown category "${rec.sourceCategory}"` };
  if (rec.currency !== "GBP" || rec.price == null) return { ...base, status: "skipped", reason: "no GBP price" };
  if (!rec.inStock) return { ...base, status: "skipped", reason: "out of stock" };
  if (rec.images.length === 0) return { ...base, status: "skipped", reason: "no photos" };
  if (acceptedCount(category) >= PER_CATEGORY) return { ...base, status: "deferred", reason: "category sample already full" };
  record.images = await downloadPhotos(key, rec.images);
  writeJson(recordFile(key), record);
  if (record.images.length === 0) return { ...base, status: "skipped", reason: "photos could not be downloaded" };
  return { ...base, status: "accepted" };
}

// ---------- run ----------

async function main() {
  await loadRobots();
  const entries = await loadSitemap();
  console.log(`Sitemap: ${entries.length} product URLs. Limit: ${LIMIT || "none"}.`);

  const queues = Object.fromEntries([...CATEGORIES, "other"].map((c) => [c, []]));
  for (const e of entries) {
    const h = LIMIT > 0 ? hint(e) : "other";
    if (h !== "skip") queues[h].push(e);
  }
  for (const [c, q] of Object.entries(queues)) queues[c] = interleaveBrands(q.sort((a, b) => score(b) - score(a)));

  const done = () => LIMIT > 0 && CATEGORIES.every((c) => acceptedCount(c) >= PER_CATEGORY);
  const order = LIMIT > 0 ? CATEGORIES : ["other"];
  let progressed = true;
  let errorsInRow = 0;
  while (!done() && progressed) {
    progressed = false;
    for (const c of order) {
      if (done()) break;
      if (LIMIT > 0 && acceptedCount(c) >= PER_CATEGORY) continue;
      const q = queues[c];
      let e;
      while ((e = q.shift()) && isDone(state.processed[e.url]));
      if (!e) continue;
      progressed = true;
      let result;
      try {
        result = await processEntry(e);
        errorsInRow = 0;
      } catch (err) {
        if (err instanceof StopError) throw err;
        // A one-off error is recorded and retried on the next run; several in a row means something is wrong — stop.
        if (++errorsInRow >= 5) throw new StopError(`Five errors in a row (last: ${err.message}). Collection stopped.`);
        console.log(`error    ${err.message}`);
        continue;
      }
      state.processed[e.url] = result;
      saveState();
      const total = Object.values(state.processed).filter((p) => p.status === "accepted").length;
      console.log(`[${stats().requests} req] ${result.status.padEnd(8)} ${(result.category ?? "-").padEnd(11)} ${result.reason ?? ""} ${result.name ?? e.url}  (accepted ${total})`);
    }
  }
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c, acceptedCount(c)]));
  console.log("Accepted per category:", counts, `Requests this run: ${stats().requests}`);
}

main().catch((err) => {
  saveState();
  if (err instanceof StopError) {
    saveStop(err);
    console.error(`\nSTOPPED: ${err.message}\nProgress is saved; run the same command again later to continue.`);
    process.exit(2);
  }
  console.error(err);
  process.exit(1);
});
