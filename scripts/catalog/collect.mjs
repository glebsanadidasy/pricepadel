// Catalogue collector for the Padel Nuestro UK store.
//   node scripts/catalog/collect.mjs --limit 60      sample: up to 60 in-stock products, spread evenly over the 6 categories
//   node scripts/catalog/collect.mjs --limit 0       everything in the sitemap (out-of-stock products are stored without photos)
//   --minutes N                                      stop cleanly after N minutes (the overnight runner uses this)
// Resumes from .source-data/state.json.
// Exit codes: 0 = finished or time budget used (state.complete tells which), 2 = blocked (block, captcha, HTTP 403 / 429),
//             4 = HTTP 503 for 3 hours in a row (stop for good).
import fs from "node:fs";
import path from "node:path";
import { fetchImage, fetchJson, fetchPage, fetchText, loadRobots, ORIGIN, saveStop, stats, StopError } from "./lib/http.mjs";
import { audienceOf, classify, parseProductPage } from "./lib/parse.mjs";
import { ORIGINALS_DIR, RAW_DIR, readJson, recordFile, SOURCE, STATE_FILE, writeJson } from "./lib/store.mjs";

const SITEMAP_URL = `${ORIGIN}/uk/media/sitemap_uk_product.xml`;
const CATEGORIES = ["rackets", "shoes", "apparel", "bags", "balls", "accessories"];
const MAX_PHOTOS = 5; // per product, and per colour when the source has colour galleries

const args = process.argv.slice(2);
const argValue = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const LIMIT = Number(argValue("--limit", "60"));
const PER_CATEGORY = LIMIT > 0 ? Math.ceil(LIMIT / CATEGORIES.length) : Infinity;
const minutes = Number(argValue("--minutes", "0"));
const DEADLINE = minutes > 0 ? Date.now() + minutes * 60000 : Infinity;
const ERROR_PAUSE_MS = 15 * 60000; // a series of server errors: wait 15 minutes, then carry on

const state = readJson(STATE_FILE, { source: SOURCE.id, processed: {} });
const saveState = () => writeJson(STATE_FILE, state);
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

// ---------- sitemap ----------

async function loadSitemap() {
  const file = path.join(RAW_DIR, "sitemap_uk_product.xml");
  const fresh = fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < 24 * 3600 * 1000;
  if (!fresh) {
    fs.writeFileSync(file, await fetchText(SITEMAP_URL));
    state.sitemapFetchedAt = new Date().toISOString();
  }
  const xml = fs.readFileSync(file, "utf8");
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)]
    .map((m) => {
      const block = m[1];
      return {
        url: block.match(/<loc>([^<]+)<\/loc>/)?.[1] ?? "",
        lastmod: block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] ?? "",
        image: block.match(/<image:loc>([^<]+)<\/image:loc>/)?.[1] ?? "",
        title: block.match(/<image:title>([^<]+)<\/image:title>/)?.[1] ?? "",
      };
    })
    .filter((e) => e.url.startsWith(`${ORIGIN}/uk/`));
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

const slug = (s) => String(s ?? "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "x";

/** Downloads up to MAX_PHOTOS photos as <prefix><n>.<ext>; files already on disk are reused (resume). */
async function downloadPhotos(key, images, prefix = "") {
  const dir = path.join(ORIGINALS_DIR, key);
  fs.mkdirSync(dir, { recursive: true });
  const out = [];
  for (const img of images) {
    if (out.length >= MAX_PHOTOS) break;
    const n = out.length + 1;
    const existing = fs.readdirSync(dir).find((f) => f.startsWith(`${prefix}${n}.`));
    if (existing) {
      out.push({ ...img, file: path.relative(RAW_DIR, path.join(dir, existing)), scrapedAt: img.scrapedAt ?? new Date().toISOString() });
      continue;
    }
    const got = await fetchImage(img.url);
    if (!got) continue;
    const ext = got.type.includes("png") ? "png" : got.type.includes("webp") ? "webp" : "jpg";
    const file = path.join(dir, `${prefix}${n}.${ext}`);
    fs.writeFileSync(file, got.bytes);
    out.push({ ...img, file: path.relative(RAW_DIR, file), bytes: got.bytes.length, scrapedAt: new Date().toISOString() });
  }
  return out;
}

/**
 * Colour galleries: the source's own pages load them from a public JSON endpoint (allowed by robots.txt).
 * One attempt per colour; if the endpoint keeps failing, colour photos are switched off for this run.
 */
const colourEndpoint = { failuresInRow: 0, disabled: false, ok: 0, failed: 0 };
async function colourGalleries(rec) {
  const byColour = new Map();
  for (const v of rec.variants ?? []) if (v.inStock && v.colour && !byColour.has(v.colour)) byColour.set(v.colour, v.sourceId);
  if (byColour.size < 2 || colourEndpoint.disabled) return null;
  const out = {};
  for (const [colour, childId] of byColour) {
    const data = await fetchJson(`${ORIGIN}/uk/swatches/ajax/media/?product_id=${encodeURIComponent(childId)}&isAjax=true`);
    const urls = [];
    if (data && typeof data === "object") {
      const gallery = data.gallery && typeof data.gallery === "object" ? Object.values(data.gallery) : [];
      for (const g of [data, ...gallery]) {
        const u = String(g?.full || g?.large || g?.img || "").split("?")[0];
        if (u.includes("/media/catalog/product/") && !urls.includes(u)) urls.push(u);
      }
    }
    if (urls.length === 0) {
      colourEndpoint.failed++;
      if (++colourEndpoint.failuresInRow >= 5) {
        colourEndpoint.disabled = true;
        state.colourPhotos = { status: "disabled", at: new Date().toISOString(), reason: "the colour photo endpoint failed 5 times in a row (HTTP 503 / empty)" };
        log("colour photos switched off for this run (endpoint keeps failing)");
        return Object.keys(out).length ? out : null;
      }
      continue;
    }
    colourEndpoint.failuresInRow = 0;
    colourEndpoint.ok++;
    state.colourPhotos = { status: "working", at: new Date().toISOString() };
    out[colour] = await downloadPhotos(rec.key, urls.map((url) => ({ url, caption: colour })), `${slug(colour)}-`);
  }
  return Object.keys(out).length ? out : null;
}

/** Already handled, unless it was only set aside for a full sample or was out of stock more than a week ago. */
function isDone(p) {
  if (!p) return false;
  if (p.status === "deferred") return false;
  if (LIMIT === 0 && p.status === "accepted" && !p.fullRun) return false; // sample products: fetch again once for colour photos
  if (p.reason?.startsWith("error:") && Date.now() - Date.parse(p.at) > 6 * 3600 * 1000) return false;
  if ((p.reason === "out of stock" || p.status === "stored") && Date.now() - Date.parse(p.at) > 7 * 24 * 3600 * 1000) return false;
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
  const record = { source: SOURCE.id, scrapedAt: at, key, category, audience: audienceOf(rec, category), ...rec, images: [] };
  const base = { key, category, at, name: rec.name, fullRun: LIMIT === 0 };
  const save = () => writeJson(recordFile(key), { ...record, galleryUrls: rec.images });
  if (category?.startsWith("excluded:")) return save(), { ...base, status: "skipped", reason: category.slice(9) };
  if (!category) return save(), { ...base, status: "skipped", reason: `unknown category "${rec.sourceCategory}"` };
  if (rec.currency !== "GBP" || rec.price == null) return save(), { ...base, status: "skipped", reason: "no GBP price" };
  // Out of stock: keep the product (for later price/stock refreshes) but download no photos.
  if (!rec.inStock) return save(), { ...base, status: LIMIT === 0 ? "stored" : "skipped", reason: "out of stock" };
  if (rec.images.length === 0) return save(), { ...base, status: LIMIT === 0 ? "stored" : "skipped", reason: "no photos" };
  if (acceptedCount(category) >= PER_CATEGORY) return save(), { ...base, status: "deferred", reason: "category sample already full" };
  record.images = await downloadPhotos(key, rec.images);
  if (LIMIT === 0) record.colourImages = await colourGalleries(record);
  save();
  if (record.images.length === 0) return { ...base, status: LIMIT === 0 ? "stored" : "skipped", reason: "photos could not be downloaded" };
  return { ...base, status: "accepted" };
}

// ---------- run ----------

async function main() {
  await loadRobots();
  const entries = await loadSitemap();
  log(`Sitemap: ${entries.length} product URLs. Limit: ${LIMIT || "none"}.`);

  const queues = Object.fromEntries([...CATEGORIES, "other"].map((c) => [c, []]));
  for (const e of entries) {
    const h = LIMIT > 0 ? hint(e) : "other";
    if (h !== "skip") queues[h].push(e);
  }
  if (LIMIT > 0) for (const [c, q] of Object.entries(queues)) queues[c] = interleaveBrands(q.sort((a, b) => score(b) - score(a)));

  const done = () => LIMIT > 0 && CATEGORIES.every((c) => acceptedCount(c) >= PER_CATEGORY);
  const order = LIMIT > 0 ? CATEGORIES : ["other"];
  let progressed = true;
  let errorsInRow = 0;
  const failures = new Map();
  while (!done() && progressed) {
    progressed = false;
    for (const c of order) {
      if (done()) break;
      if (Date.now() > DEADLINE) {
        log(`Time budget used; ${stats().requests} requests this run. Run again to continue.`);
        state.complete = false;
        saveState();
        return;
      }
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
        state.lastOkAt = new Date().toISOString();
      } catch (err) {
        if (err instanceof StopError) throw err;
        log(`error    ${err.message}`);
        const tries = (failures.get(e.url) ?? 0) + 1;
        failures.set(e.url, tries);
        if (tries < 3) q.unshift(e); // try this page again
        else state.processed[e.url] = { status: "skipped", reason: `error: ${err.message}`, at: new Date().toISOString() };
        if (++errorsInRow >= 5) {
          // A series of server errors (the source's backend is struggling): wait 15 minutes and carry on.
          log("five errors in a row — pausing 15 minutes");
          state.pauses = [...(state.pauses ?? []), { at: new Date().toISOString(), reason: err.message }].slice(-50);
          saveState();
          await new Promise((r) => setTimeout(r, ERROR_PAUSE_MS));
          errorsInRow = 0;
        }
        continue;
      }
      state.processed[e.url] = result;
      saveState();
      const total = Object.values(state.processed).filter((p) => p.status === "accepted").length;
      log(`[${stats().requests} req] ${result.status.padEnd(8)} ${(result.category ?? "-").padEnd(11)} ${result.reason ?? ""} ${result.name ?? e.url}  (accepted ${total})`);
    }
  }
  state.complete = LIMIT === 0;
  state.completedAt = new Date().toISOString();
  saveState();
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c, acceptedCount(c)]));
  log("Accepted per category:", counts, `Requests this run: ${stats().requests}`, `Colour galleries: ${colourEndpoint.ok} ok, ${colourEndpoint.failed} failed`);
}

main().catch((err) => {
  saveState();
  if (err instanceof StopError) {
    saveStop(err);
    console.error(`\nSTOPPED: ${err.message}\nProgress is saved; run the same command again later to continue.`);
    process.exit(err.details?.sustained503 ? 4 : 2);
  }
  console.error(err);
  process.exit(1);
});
