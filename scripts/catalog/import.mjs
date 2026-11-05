// Builds the store catalogue (data/catalog/products.json) from collected records — no network.
//   node scripts/catalog/import.mjs
// - descriptions: drops sentences that mention the source shop or promise delivery / returns / warranty
// - photos: rejected ones (data/catalog/photo-review.json) are left out; the rest are re-saved under neutral names
//   in public/images/products (metadata stripped, never edited otherwise)
// - a product with no usable photo, or whose photos have not been checked yet, is hidden
// Writes data/catalog/import-report.md for the owner.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { titleCase } from "./lib/parse.mjs";
import { CATALOG_FILE, CATALOG_DIR, PHOTO_REVIEW_FILE, PUBLIC_PHOTOS_DIR, RAW_DIR, readJson, recordFile, SETTINGS_FILE, SOURCE, STATE_FILE, writeJson } from "./lib/store.mjs";

const SOURCE_NAME = /p[aáā]del\s*nuestro|padelnuestro/i;
const PROMISE = /\b(deliver(y|ies|ed)?|shipping|shipped|dispatch(ed)?|free returns?|returns? policy|money[- ]back|warranty|guarantee(d)? (delivery|returns?))\b/i;
const BADGE_ATTR = /outlet|exclusive|bestseller|best seller|novelty|new arrival|offer|discount|gift|promo|official/i;
const DROP_ATTR = new Set(["brand", "product", "description", "user"]);

export const DEFAULT_SETTINGS = {
  markup: { default: 1.15, byCategory: {}, byBrand: {} },
  delivery: {
    currency: "GBP",
    // Customer price by order subtotal (pence): under £85 → £12.95; £85–£169.99 → £6.95; £170 and over → free.
    tiers: [
      { below: 8500, price: 1295 },
      { below: 17000, price: 695 },
      { below: null, price: 0 },
    ],
    ourCost: null,
    ourCostNote: "",
  },
  rewriteApproved: false,
  hiddenSources: [],
  sources: { [SOURCE.id]: { name: SOURCE.name, url: "https://www.padelnuestro.com/uk/" } },
};

const report = { mentions: [], promises: [], hidden: [], rejectedPhotos: [], badges: 0 };

function slugify(s) {
  return s
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
function cleanText(text, name, hits) {
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
      const items = b.items.map((t) => cleanText(t, name, hits)).filter(Boolean);
      if (items.length) out.push({ type: "list", items });
      continue;
    }
    // The first heading just repeats the product name.
    if (i === 0 && b.type === "heading" && b.text.toLowerCase().replace(/\W/g, "") === name.toLowerCase().replace(/\W/g, "")) continue;
    const text = cleanText(b.text, name, hits);
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

async function savePhoto(srcAbs, outAbs) {
  if (fs.existsSync(outAbs) && fs.statSync(outAbs).mtimeMs >= fs.statSync(srcAbs).mtimeMs) {
    const m = await sharp(outAbs).metadata();
    return { width: m.width, height: m.height };
  }
  // Re-encoded at high quality only to drop embedded metadata; size and content stay as the original.
  const info = await sharp(srcAbs).rotate().flatten({ background: "#ffffff" }).jpeg({ quality: 92, mozjpeg: true }).toFile(outAbs);
  return { width: info.width, height: info.height };
}

async function main() {
  const state = readJson(STATE_FILE, { processed: {} });
  const review = readJson(PHOTO_REVIEW_FILE, { reviewed: {}, rejected: {} });
  if (!fs.existsSync(SETTINGS_FILE)) writeJson(SETTINGS_FILE, DEFAULT_SETTINGS);
  const previous = new Map(readJson(CATALOG_FILE, []).map((p) => [p.id, p]));
  fs.mkdirSync(PUBLIC_PHOTOS_DIR, { recursive: true });

  const accepted = Object.values(state.processed).filter((p) => p.status === "accepted");
  const slugs = new Set();
  const items = [];
  const usedPhotoFiles = new Set();

  for (const entry of accepted) {
    const rec = readJson(recordFile(entry.key), null);
    if (!rec) continue;
    rec.name = rec.name.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    // Some source titles are all capitals; shout less.
    const letters = rec.name.replace(/[^\p{L}]/gu, "");
    if (letters && letters.replace(/\p{Lu}/gu, "").length / letters.length < 0.2) rec.name = titleCase(rec.name).replace(/’S\b/g, "’s");
    const id = `p${shortHash(`${rec.source}:${rec.sourceSku}`)}`;
    let slug = slugify(rec.name) || id;
    if (slugs.has(slug)) slug = `${slug}-${id.slice(1, 5)}`;
    slugs.add(slug);

    const { blocks, hits } = cleanDescription(rec.description, rec.name);
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
        const size = sizeLabel(v.size, rec.category, v.sizeKind);
        const colour = v.colour ?? colourAttr ?? "";
        return {
          sku: [skuBase, slugify(colour).slice(0, 12), slugify(v.size ?? "")].filter(Boolean).join("-").toUpperCase(),
          colour,
          colourHex: swatchFor(colour, v.colourHex),
          size,
          inStock: !!v.inStock,
          sourcePrice: Math.round((v.price ?? rec.price) * 100),
          sourceSku: v.sourceSku,
          sourceVariantId: v.sourceId,
        };
      })
      .sort((a, b) => a.colour.localeCompare(b.colour) || sizeSort(a.size?.replace(/^EU /, ""), b.size?.replace(/^EU /, "")));

    // Photos: neutral public names, rejected ones left out.
    const images = [];
    const reviewed = !!review.reviewed[entry.key];
    for (const [i, img] of rec.images.entries()) {
      const ref = `${entry.key}/${i + 1}`;
      const rejected = review.rejected[ref];
      if (rejected) {
        report.rejectedPhotos.push({ name: rec.name, photo: i + 1, reason: rejected });
        continue;
      }
      const outName = `${slug}-${images.length + 1}.jpg`;
      const dims = await savePhoto(path.join(RAW_DIR, img.file), path.join(PUBLIC_PHOTOS_DIR, outName));
      usedPhotoFiles.add(outName);
      images.push({
        src: `/images/products/${outName}`,
        alt: images.length === 0 ? rec.name : `${rec.name}, view ${images.length + 1}`,
        width: dims.width,
        height: dims.height,
        source: rec.source,
        sourceUrl: img.url,
        scrapedAt: img.scrapedAt,
      });
    }

    let hiddenReason = null;
    if (!reviewed) hiddenReason = "photos not checked yet";
    else if (images.length === 0) {
      const why = [...new Set(rec.images.map((_, i) => review.rejected[`${entry.key}/${i + 1}`]).filter(Boolean))];
      hiddenReason = `no usable photo (${why.join("; ") || "none collected"})`;
    }
    if (hiddenReason) report.hidden.push({ name: rec.name, reason: hiddenReason });

    // A later price/stock refresh is newer than the collected page: keep its numbers.
    const prev = previous.get(id);
    if (prev && prev.priceCheckedAt > rec.scrapedAt) {
      const fresh = new Map(prev.variants.map((v) => [v.sku, v]));
      for (const v of variants) {
        const f = fresh.get(v.sku);
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
      variants,
      hidden: !!hiddenReason,
      hiddenReason,
      // Admin-only fields (never copied into the public product shape):
      source: rec.source,
      sourceUrl: rec.sourceUrl,
      sourceSku: rec.sourceSku,
      scrapedAt: rec.scrapedAt,
      priceCheckedAt: prev?.priceCheckedAt && prev.priceCheckedAt > rec.scrapedAt ? prev.priceCheckedAt : rec.scrapedAt,
    });
  }

  // Remove public photo files that no longer belong to any product.
  for (const f of fs.readdirSync(PUBLIC_PHOTOS_DIR)) if (!usedPhotoFiles.has(f)) fs.rmSync(path.join(PUBLIC_PHOTOS_DIR, f));

  writeJson(CATALOG_FILE, items);
  writeReport(state, items);
  const visible = items.filter((p) => !p.hidden && p.variants.some((v) => v.inStock));
  console.log(`Imported ${items.length} products (${visible.length} visible), ${items.reduce((n, p) => n + p.images.length, 0)} photos.`);
}

function writeReport(state, items) {
  const all = Object.entries(state.processed);
  const by = (s) => all.filter(([, p]) => p.status === s);
  const reasons = {};
  for (const [, p] of by("skipped")) reasons[p.reason] = (reasons[p.reason] ?? 0) + 1;
  const cats = {};
  for (const p of items) cats[p.category] = (cats[p.category] ?? 0) + 1;
  const lines = [
    "# Catalogue import report (admin only)",
    "",
    `Generated ${new Date().toISOString()}. Source: ${SOURCE.name}.`,
    "",
    "## Totals",
    `- Source pages checked: ${all.length}`,
    `- Imported products: ${items.length} (${Object.entries(cats).map(([c, n]) => `${c} ${n}`).join(", ")})`,
    `- Visible in the shop: ${items.filter((p) => !p.hidden && p.variants.some((v) => v.inStock)).length}`,
    `- Photos used: ${items.reduce((n, p) => n + p.images.length, 0)}; photos rejected: ${report.rejectedPhotos.length}`,
    `- Pages left for later (category sample already full): ${by("deferred").length}`,
    `- Products whose source badges (Bestseller, Outlet, discount % …) were ignored: ${report.badges}`,
    "",
    "## Skipped pages",
    ...Object.entries(reasons).sort((a, b) => b[1] - a[1]).map(([r, n]) => `- ${r}: ${n}`),
    "",
    "## Hidden products",
    ...(report.hidden.length ? report.hidden.map((h) => `- ${h.name} — ${h.reason}`) : ["- none"]),
    "",
    "## Rejected photos",
    ...(report.rejectedPhotos.length ? report.rejectedPhotos.map((r) => `- ${r.name}, photo ${r.photo}: ${r.reason}`) : ["- none"]),
    "",
    "## Descriptions: sentences mentioning the source shop (removed)",
    ...(report.mentions.length ? report.mentions.map((m) => `- **${m.name}**: ${m.removed.map((s) => `“${s}”`).join(" ")}`) : ["- none"]),
    "",
    "## Descriptions: delivery / return / warranty promises (removed)",
    ...(report.promises.length ? report.promises.map((m) => `- **${m.name}**: ${m.removed.map((s) => `“${s}”`).join(" ")}`) : ["- none"]),
    "",
  ];
  fs.writeFileSync(path.join(CATALOG_DIR, "import-report.md"), lines.join("\n"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
