// Builds the store catalogue from collected records — no network.
//   node scripts/catalog/import.mjs
// Writes
//   data/catalog/products.json   public catalogue (in Git)
//   sources/<id>/offers.json     source links, prices, stock, SKUs (admin only, never in Git)
//   sources/import-report.md     report for the owner, sources/import-summary.json for the overnight report
//   public/images/products/xx/   photos under neutral names, in hash sub-folders (metadata stripped, never edited)
// Descriptions: sentences that mention the source shop or promise delivery / returns / warranty are removed.
// Photos are checked automatically: broken or too small files, and local OCR for the source shop's name.
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { titleCase } from "./lib/parse.mjs";
import {
  CATALOG_FILE, IMPORT_REPORT_FILE, OCR_BIN, offersFile, PHOTO_CHECKS_FILE, PUBLIC_PHOTOS_DIR, publicPhotoPath, RAW_DIR, readJson, recordFile,
  SETTINGS_FILE, SOURCE, SOURCE_REGISTRY_FILE, SOURCES_DIR, STATE_FILE, writeJson,
} from "./lib/store.mjs";

const SOURCE_NAME = /p[aáā]del\s*nuestro|padelnuestro/i;
const PROMISE = /\b(deliver(y|ies|ed)?|shipping|shipped|dispatch(ed)?|free returns?|returns? policy|money[- ]back|warranty|guarantee(d)? (delivery|returns?))\b/i;
const BADGE_ATTR = /outlet|exclusive|bestseller|best seller|novelty|new arrival|offer|discount|gift|promo|official/i;
const DROP_ATTR = new Set(["brand", "product", "description", "user"]);
const MIN_PHOTO_SIDE = 300; // px; smaller files are thumbnails, not product photos

export const DEFAULT_SETTINGS = {
  markup: { default: 1.15, byCategory: {}, byBrand: {} },
  // Customer delivery is free; this is what delivery costs us, by order value (pence).
  delivery: {
    customerPrice: 0,
    ourCostTiers: [
      { below: 8500, price: 1295 },
      { below: 17000, price: 695 },
      { below: null, price: 0 },
    ],
  },
  // GBP → other currencies. Prices are kept in GBP.
  rates: { EUR: 1.15, USD: 1.3 },
  rewriteApproved: false,
  hiddenSources: [],
  hiddenProducts: [],
  hiddenPhotos: [],
};

const report = { mentions: [], promises: [], hidden: [], rejectedPhotos: [], badges: 0 };

function slugify(s) {
  return String(s ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}

const shortHash = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 8);

/** Removes only the offending sentences; a block left empty disappears. */
function cleanText(text, hits) {
  const sentences = text.match(/[^.!?]+(?:[.!?]+|$)/g) ?? [text];
  const kept = sentences.filter((s) => {
    if (SOURCE_NAME.test(s)) return hits.mentions.push(s.trim()), false;
    if (PROMISE.test(s)) return hits.promises.push(s.trim()), false;
    return true;
  });
  return kept.join("").replace(/\s+/g, " ").trim();
}

function cleanDescription(blocks, name) {
  const hits = { mentions: [], promises: [] };
  const out = [];
  for (const [i, b] of blocks.entries()) {
    if (b.type === "list") {
      const items = b.items.map((t) => cleanText(t, hits)).filter(Boolean);
      if (items.length) out.push({ type: "list", items });
      continue;
    }
    // The first heading just repeats the product name.
    if (i === 0 && b.type === "heading" && b.text.toLowerCase().replace(/\W/g, "") === name.toLowerCase().replace(/\W/g, "")) continue;
    const text = cleanText(b.text, hits);
    if (text && !(b.type === "heading" && text.length < 3)) out.push({ type: b.type, text });
  }
  // A heading with nothing after it is dropped.
  const final = out.filter((b, i) => b.type !== "heading" || (out[i + 1] && out[i + 1].type !== "heading"));
  return { blocks: final, hits };
}

const SIZE_ORDER = ["XXXS", "XXS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "XXXL", "3XL", "4XL"];
function sizeSort(a, b) {
  const ia = SIZE_ORDER.indexOf(String(a).toUpperCase());
  const ib = SIZE_ORDER.indexOf(String(b).toUpperCase());
  if (ia >= 0 && ib >= 0) return ia - ib;
  const na = parseFloat(String(a).replace(",", "."));
  const nb = parseFloat(String(b).replace(",", "."));
  if (!isNaN(na) && !isNaN(nb)) return na - nb;
  return String(a).localeCompare(String(b));
}

const COLOUR_HEX = {
  black: "#111111", white: "#ffffff", navy: "#1f2a44", blue: "#1e5bb8", red: "#c62828", green: "#2e7d32", yellow: "#f2d600", orange: "#ef6c00",
  pink: "#e91e63", purple: "#7b1fa2", lilac: "#c7b3e3", grey: "#8a8f98", gray: "#8a8f98", silver: "#c0c0c0", gold: "#c9a227", brown: "#6d4c41",
  beige: "#e8dcc4", turquoise: "#1fb5ad", lime: "#c6e81c", fuchsia: "#d81b9a", coral: "#ff7f6b", khaki: "#a39b6b", burgundy: "#7b1f2e",
};
function swatchFor(name, hex) {
  if (hex) return hex;
  const n = (name ?? "").toLowerCase();
  const key = Object.keys(COLOUR_HEX).find((k) => n.includes(k));
  return key ? COLOUR_HEX[key] : "#d9d9d9";
}

/** Shoe sizes on the source are EU sizes; say so, so customers do not read them as UK sizes. */
function sizeLabel(size, category, kind) {
  if (!size) return null;
  if (category === "shoes" && /^\d{2}(\.5)?$/.test(size) && /size|talla/i.test(kind ?? "size")) return `EU ${size}`;
  return size;
}

// ---------- automatic photo checks ----------

/** Runs local OCR on photos not checked yet (batches, so one slow file never blocks the rest). */
function runOcr(files, checks) {
  const todo = files.filter((f) => checks[f]?.ocr === undefined);
  if (todo.length === 0) return;
  if (!fs.existsSync(OCR_BIN)) {
    const src = path.join(path.dirname(new URL(import.meta.url).pathname), "ocr", "ocr.swift");
    fs.mkdirSync(path.dirname(OCR_BIN), { recursive: true });
    const built = spawnSync("swiftc", ["-O", src, "-o", OCR_BIN], { encoding: "utf8" });
    if (built.status !== 0) {
      console.log("OCR not available:", built.stderr?.slice(0, 200));
      return;
    }
  }
  for (let i = 0; i < todo.length; i += 100) {
    const batch = todo.slice(i, i + 100);
    const res = spawnSync(OCR_BIN, batch.map((f) => path.join(RAW_DIR, f)), { encoding: "utf8", timeout: 600000, maxBuffer: 64 * 1024 * 1024 });
    for (const line of (res.stdout ?? "").split("\n")) {
      if (!line.trim()) continue;
      try {
        const { file, text } = JSON.parse(line);
        const rel = path.relative(RAW_DIR, file);
        checks[rel] = { ...checks[rel], ocr: text.slice(0, 500) };
      } catch {
        /* a broken line is retried next time */
      }
    }
  }
}

async function checkPhoto(rel, checks) {
  const c = (checks[rel] ??= {});
  if (c.broken === undefined) {
    try {
      const m = await sharp(path.join(RAW_DIR, rel)).metadata();
      c.width = m.width;
      c.height = m.height;
      c.broken = !m.width || !m.height;
    } catch {
      c.broken = true;
    }
  }
  if (c.broken) return "broken or unreadable file";
  if (Math.min(c.width, c.height) < MIN_PHOTO_SIDE) return `too small (${c.width}×${c.height})`;
  if (c.ocr && SOURCE_NAME.test(c.ocr.replace(/\s+/g, " "))) return "source shop name found in the photo (OCR)";
  return null;
}

async function savePhoto(srcAbs, outAbs) {
  if (fs.existsSync(outAbs) && fs.statSync(outAbs).mtimeMs >= fs.statSync(srcAbs).mtimeMs) {
    const m = await sharp(outAbs).metadata();
    return { width: m.width, height: m.height };
  }
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });
  // Re-encoded at high quality only to drop embedded metadata; size and content stay as the original.
  const info = await sharp(srcAbs).rotate().flatten({ background: "#ffffff" }).jpeg({ quality: 92, mozjpeg: true }).toFile(outAbs);
  return { width: info.width, height: info.height };
}

// ---------- main ----------

function migrateSettings(s) {
  const out = { ...DEFAULT_SETTINGS, ...s };
  out.markup = { ...DEFAULT_SETTINGS.markup, ...s.markup };
  out.delivery = { ...DEFAULT_SETTINGS.delivery, ...(s.delivery?.ourCostTiers ? s.delivery : {}) };
  out.rates = { ...DEFAULT_SETTINGS.rates, ...s.rates };
  delete out.sources; // source names live in sources/sources.json (not in Git)
  return out;
}

async function main() {
  const state = readJson(STATE_FILE, { processed: {} });
  writeJson(SETTINGS_FILE, migrateSettings(readJson(SETTINGS_FILE, {})));
  writeJson(SOURCE_REGISTRY_FILE, { ...readJson(SOURCE_REGISTRY_FILE, {}), [SOURCE.id]: { name: SOURCE.name, url: SOURCE.url } });
  const prevOffers = readJson(offersFile(SOURCE.id), {});
  const checks = readJson(PHOTO_CHECKS_FILE, {});
  fs.mkdirSync(PUBLIC_PHOTOS_DIR, { recursive: true });

  const entries = Object.values(state.processed).filter((p) => p.status === "accepted" || p.status === "stored");
  const records = entries.map((e) => readJson(recordFile(e.key), null)).filter(Boolean);
  // OCR every collected photo first (cached; only new photos are read).
  const allPhotos = records.flatMap((r) => [...(r.images ?? []), ...Object.values(r.colourImages ?? {}).flat()].map((i) => i.file).filter(Boolean));
  runOcr([...new Set(allPhotos)], checks);
  writeJson(PHOTO_CHECKS_FILE, checks);

  const slugs = new Set();
  const seenIds = new Set();
  const items = [];
  const offers = {};
  const usedPhotoFiles = new Set();

  for (const rec of records) {
    const id = `p${shortHash(`${rec.source}:${rec.sourceSku}`)}`;
    if (seenIds.has(id)) continue; // the same product under two URLs
    seenIds.add(id);
    rec.name = rec.name.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    // Some source titles are all capitals; shout less.
    const letters = rec.name.replace(/[^\p{L}]/gu, "");
    if (letters && letters.replace(/\p{Lu}/gu, "").length / letters.length < 0.2) rec.name = titleCase(rec.name).replace(/’S\b/g, "’s");
    let slug = slugify(rec.name) || id;
    if (slugs.has(slug)) slug = `${slug}-${id.slice(1, 5)}`;
    slugs.add(slug);

    const { blocks, hits } = cleanDescription(rec.description ?? [], rec.name);
    if (hits.mentions.length) report.mentions.push({ name: rec.name, removed: hits.mentions });
    if (hits.promises.length) report.promises.push({ name: rec.name, removed: hits.promises });
    if (rec.ignoredBadges?.length) report.badges++;

    const specs = rec.attributes
      .filter((a) => !DROP_ATTR.has(a.label.toLowerCase()) && !BADGE_ATTR.test(a.label) && !SOURCE_NAME.test(a.value) && a.value)
      .map((a) => ({ label: a.label.replace(/^Color$/i, "Colour"), value: a.value }));
    const colourAttr = rec.attributes.find((a) => /^colou?r$/i.test(a.label))?.value ?? null;

    // Variants: one per source child product (configurable) or a single one (simple product).
    const skuBase = `PP-${id.slice(1, 7).toUpperCase()}`;
    const rawVariants = rec.variants ?? [{ sourceId: null, sourceSku: rec.sourceSku, colour: null, colourHex: null, size: null, sizeKind: null, price: rec.price, inStock: rec.inStock }];
    const variants = rawVariants
      .map((v) => {
        const colour = String(v.colour ?? colourAttr ?? "");
        v.size = v.size == null ? null : String(v.size);
        return {
          sku: [skuBase, slugify(colour).slice(0, 12), slugify(v.size ?? "")].filter(Boolean).join("-").toUpperCase(),
          colour,
          colourHex: swatchFor(colour, v.colourHex),
          size: sizeLabel(v.size, rec.category, v.sizeKind),
          inStock: !!v.inStock,
          sourcePrice: Math.round((v.price ?? rec.price) * 100),
          sourceSku: v.sourceSku,
          sourceVariantId: v.sourceId,
        };
      })
      .sort((a, b) => a.colour.localeCompare(b.colour) || sizeSort(a.size?.replace(/^EU /, ""), b.size?.replace(/^EU /, "")));

    // Photos: main gallery (colour null) + colour galleries; neutral public names; automatic checks.
    const images = [];
    const photoSources = {};
    const savedBySource = new Map();
    const groups = [{ colour: null, list: rec.images ?? [] }, ...Object.entries(rec.colourImages ?? {}).map(([colour, list]) => ({ colour, list }))];
    let n = 0;
    for (const g of groups) {
      for (const img of g.list) {
        if (!img.file) continue;
        const problem = await checkPhoto(img.file, checks);
        if (problem) {
          report.rejectedPhotos.push({ name: rec.name, photo: img.file.split("/").pop(), reason: problem });
          continue;
        }
        let saved = savedBySource.get(img.url);
        if (!saved) {
          n++;
          const p = publicPhotoPath(`${slug}-${n}.jpg`);
          const dims = await savePhoto(path.join(RAW_DIR, img.file), p.abs);
          saved = { src: p.src, ...dims };
          savedBySource.set(img.url, saved);
          usedPhotoFiles.add(p.rel);
          photoSources[p.src] = { sourceUrl: img.url, scrapedAt: img.scrapedAt };
        }
        const alt = g.colour ? `${rec.name}, ${g.colour}` : images.length === 0 ? rec.name : `${rec.name}, view ${images.length + 1}`;
        images.push({ src: saved.src, alt, width: saved.width, height: saved.height, colour: g.colour });
      }
    }

    const inStock = variants.some((v) => v.inStock);
    let hiddenReason = null;
    if (inStock && images.length === 0) {
      const why = [...new Set(report.rejectedPhotos.filter((r) => r.name === rec.name).map((r) => r.reason))];
      hiddenReason = `no usable photo${why.length ? ` (${why.join("; ")})` : ""}`;
      report.hidden.push({ name: rec.name, reason: hiddenReason });
    }

    // A later price/stock refresh is newer than the collected page: keep its numbers.
    const prev = prevOffers[id];
    if (prev && prev.priceCheckedAt > rec.scrapedAt) {
      for (const v of variants) {
        const f = prev.variants?.[v.sku];
        if (f) Object.assign(v, { inStock: f.inStock, sourcePrice: f.sourcePrice });
      }
    }

    items.push({
      id,
      slug,
      name: rec.name,
      brand: rec.brand,
      mpn: rec.mpn,
      category: rec.category,
      audience: rec.audience,
      specs,
      description: blocks,
      descriptionRewritten: false,
      images,
      variants: variants.map((v) => ({ sku: v.sku, colour: v.colour, colourHex: v.colourHex, size: v.size })),
      hidden: !!hiddenReason,
      hiddenReason,
      source: rec.source,
      collectedAt: rec.scrapedAt.slice(0, 10),
    });
    offers[id] = {
      sourceUrl: rec.sourceUrl,
      sourceSku: rec.sourceSku,
      scrapedAt: rec.scrapedAt,
      priceCheckedAt: prev?.priceCheckedAt && prev.priceCheckedAt > rec.scrapedAt ? prev.priceCheckedAt : rec.scrapedAt,
      variants: Object.fromEntries(variants.map((v) => [v.sku, { sourcePrice: v.sourcePrice, inStock: v.inStock, sourceSku: v.sourceSku, sourceVariantId: v.sourceVariantId }])),
      photos: photoSources,
    };
  }

  // Remove public photo files no product uses any more (they are rebuilt from .source-data on every import).
  for (const dir of fs.readdirSync(PUBLIC_PHOTOS_DIR, { withFileTypes: true })) {
    const abs = path.join(PUBLIC_PHOTOS_DIR, dir.name);
    if (dir.isFile()) fs.rmSync(abs);
    else for (const f of fs.readdirSync(abs)) if (!usedPhotoFiles.has(`${dir.name}/${f}`)) fs.rmSync(path.join(abs, f));
  }

  writeJson(PHOTO_CHECKS_FILE, checks);
  writeJson(offersFile(SOURCE.id), offers);
  writeJson(CATALOG_FILE, items);
  const summary = writeReport(state, items, offers);
  console.log(`Imported ${items.length} products (${summary.onSale} on sale), ${summary.photos} photos.`);
}

function writeReport(state, items, offers) {
  const all = Object.entries(state.processed);
  const reasons = {};
  for (const [, p] of all) if (p.status !== "accepted") reasons[`${p.status}: ${p.reason}`] = (reasons[`${p.status}: ${p.reason}`] ?? 0) + 1;
  const cats = {};
  for (const p of items) cats[p.category] = (cats[p.category] ?? 0) + 1;
  const inStock = (p) => Object.values(offers[p.id].variants).some((v) => v.inStock);
  const onSale = items.filter((p) => !p.hidden && p.images.length && inStock(p)).length;
  const photos = new Set(items.flatMap((p) => p.images.map((i) => i.src))).size;
  const rejectedByReason = {};
  for (const r of report.rejectedPhotos) {
    const k = r.reason.replace(/\(.*\)/, "").trim();
    rejectedByReason[k] = (rejectedByReason[k] ?? 0) + 1;
  }
  const summary = {
    at: new Date().toISOString(),
    pagesChecked: all.length,
    products: items.length,
    byCategory: cats,
    inStock: items.filter(inStock).length,
    onSale,
    hidden: report.hidden.length,
    photos,
    rejectedPhotos: report.rejectedPhotos.length,
    rejectedByReason,
    mentionsRemoved: report.mentions.length,
    promisesRemoved: report.promises.length,
    skipped: reasons,
  };
  writeJson(path.join(SOURCES_DIR, "import-summary.json"), summary);
  const lines = [
    "# Catalogue import report (admin only — not in Git)",
    "",
    `Generated ${summary.at}. Source: ${SOURCE.name}.`,
    "",
    "## Totals",
    `- Source pages checked: ${all.length}`,
    `- Imported products: ${items.length} (${Object.entries(cats).map(([c, n]) => `${c} ${n}`).join(", ")})`,
    `- In stock at the source: ${summary.inStock}; on sale in the shop: ${onSale}`,
    `- Photos used: ${photos}; photos rejected by the automatic checks: ${report.rejectedPhotos.length}`,
    `- Products whose source badges (Bestseller, Outlet, discount % …) were ignored: ${report.badges}`,
    "",
    "## Pages not imported as products for sale",
    ...Object.entries(reasons).sort((a, b) => b[1] - a[1]).map(([r, n]) => `- ${r}: ${n}`),
    "",
    "## Hidden products (in stock, but no usable photo)",
    ...(report.hidden.length ? report.hidden.map((h) => `- ${h.name} — ${h.reason}`) : ["- none"]),
    "",
    "## Rejected photos",
    ...(report.rejectedPhotos.length ? report.rejectedPhotos.map((r) => `- ${r.name}, ${r.photo}: ${r.reason}`) : ["- none"]),
    "",
    "## Descriptions: sentences mentioning the source shop (removed)",
    ...(report.mentions.length ? report.mentions.map((m) => `- **${m.name}**: ${m.removed.map((s) => `“${s}”`).join(" ")}`) : ["- none"]),
    "",
    "## Descriptions: delivery / return / warranty promises (removed)",
    ...(report.promises.length ? report.promises.map((m) => `- **${m.name}**: ${m.removed.map((s) => `“${s}”`).join(" ")}`) : ["- none"]),
    "",
  ];
  fs.writeFileSync(IMPORT_REPORT_FILE, lines.join("\n"));
  return summary;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
