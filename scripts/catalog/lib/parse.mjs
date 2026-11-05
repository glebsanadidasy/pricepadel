// Turns one source product page into a plain record. Takes only what the owner asked for:
// no reviews, ratings, old prices, discounts, badges, gifts, promotions or delivery/return/warranty promises.
import { parse as parseHtml } from "node-html-parser";

const decode = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
const clean = (s) => decode(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

/** Reads the JSON value (object or array) that starts at `start`, honouring strings. */
function jsonAt(s, start) {
  let depth = 0;
  let inStr = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (c === "\\") i++;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === "{" || c === "[") depth++;
    else if (c === "}" || c === "]") {
      depth--;
      if (depth === 0) return JSON.parse(s.slice(start, i + 1));
    }
  }
  throw new Error("Unterminated JSON");
}

function jsonAfter(s, marker, from = 0) {
  const i = s.indexOf(marker, from);
  if (i < 0) return null;
  let j = i + marker.length;
  while (j < s.length && s[j] !== "{" && s[j] !== "[") j++;
  try {
    return jsonAt(s, j);
  } catch {
    return null;
  }
}

/** Source page title is "Nice Name | Pādel Nuestro"; the H1 is the same name in capitals plus a maker code. */
const SOURCE_NAME = /p[aáā]del\s*nuestro|padelnuestro/i;

/** "BULLPADEL HACK VIBRAM 26V" → "Bullpadel Hack Vibram 26V": words with digits keep their capitals. */
export function titleCase(s) {
  return s
    .split(/(\s+)/)
    .map((w) => (/\d/.test(w) ? w.toUpperCase() : w.toLowerCase().replace(/(^|[\-/(])([\p{L}])/gu, (_, a, b) => a + b.toUpperCase())))
    .join("");
}

export function parseProductPage(html, url) {
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((m) => {
      try {
        return JSON.parse(m[1]);
      } catch {
        return null;
      }
    })
    .flatMap((j) => (j?.["@graph"] ? j["@graph"] : [j]))
    .find((j) => j?.["@type"] === "Product");
  if (!ld) return null;

  const layerStart = html.indexOf('dataLayer.push({"page_title"');
  const layer = layerStart >= 0 ? jsonAfter(html, "dataLayer.push(", layerStart) : {};
  const view = html.indexOf('"event":"view_item"');
  const viewLayer = view >= 0 ? jsonAfter(html, "push(", html.lastIndexOf("push(", view)) : null;
  const gaItem = viewLayer?.ecommerce?.items?.[0] ?? {};

  const h1 = clean(html.match(/<h1[^>]*class="page-title"[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? ld.name ?? "");
  const pageTitle = clean(String(layer?.page_title ?? "")).split(" | ")[0].trim();
  // Manufacturer code: a letters+digits token that is in the H1 but not in the tidy page title (e.g. DC91004000, KZ6342).
  const titleTokens = new Set(pageTitle.toUpperCase().split(/\s+/));
  const mpn = h1.split(/\s+/).find((t) => /^[A-Z0-9]*\d[A-Z0-9]*$/.test(t) && /[A-Z]/.test(t) && t.length >= 5 && !titleTokens.has(t)) ?? null;
  // The tidy page title is used unless it disagrees with the H1 about numbers (it says "2 Ball Can" where the H1 says "3-BALL CAN").
  const digits = (s) => s.toUpperCase().match(/\d+[A-Z]*/g) ?? [];
  const h1Digits = new Set(digits(h1.replace(/-/g, " ")));
  const titleOk = pageTitle && !SOURCE_NAME.test(pageTitle) && digits(pageTitle.replace(/-/g, " ")).every((d) => h1Digits.has(d));
  const tidy = titleOk ? pageTitle : titleCase(h1.split(/\s+/).filter((t) => t !== mpn).join(" "));
  const name = tidy.charAt(0).toUpperCase() + tidy.slice(1);

  const attributes = [...html.matchAll(/description-attributes-label">([\s\S]*?)<\/span>\s*<span class="description-attributes-value">([\s\S]*?)<\/span>/g)].map((m) => ({
    label: clean(m[1]),
    value: clean(m[2]),
  }));
  const attr = (label) => attributes.find((a) => a.label.toLowerCase() === label.toLowerCase())?.value ?? "";

  // Description: only the product description block, as headings / paragraphs / lists of plain text.
  const descAt = html.indexOf('<div class="product attribute description">');
  const descEl = descAt < 0 ? null : parseHtml(html.slice(descAt, descAt + 200000), { blockTextElements: { script: false, style: false } }).querySelector(".value");
  const description = [];
  if (descEl) {
    for (const el of descEl.querySelectorAll("h1,h2,h3,h4,p,ul,ol")) {
      const tag = el.rawTagName.toLowerCase();
      if (tag === "ul" || tag === "ol") {
        const items = el.querySelectorAll("li").map((li) => clean(li.innerHTML)).filter(Boolean);
        if (items.length) description.push({ type: "list", items });
      } else if (!el.closest("li")) {
        const text = clean(el.innerHTML);
        if (text) description.push({ type: /^h/.test(tag) ? "heading" : "paragraph", text });
      }
    }
    if (description.length === 0) {
      const text = clean(descEl.innerHTML);
      if (text) description.push({ type: "paragraph", text });
    }
  }

  // Gallery: original files (no resize query), images only — videos are skipped.
  const galleryAt = html.indexOf('"mage/gallery/gallery"');
  const gallery = galleryAt >= 0 ? jsonAfter(html, '"data":', galleryAt) ?? [] : [];
  const seen = new Set();
  const images = [];
  for (const g of gallery) {
    if (g.type && g.type !== "image") continue;
    const src = String(g.full || g.img || "").split("?")[0];
    if (!src || seen.has(src)) continue;
    seen.add(src);
    images.push({ url: src, caption: g.caption ?? "" });
  }

  // Variants (configurable products): colour / size options, price and stock per child product.
  const cfg = jsonAfter(html, '"jsonConfig":');
  const swatches = jsonAfter(html, '"jsonSwatchConfig":') ?? {};
  let variants = null;
  if (cfg?.attributes && cfg.index) {
    const salable = new Set(Object.values(cfg.salable ?? {}).flatMap((byOption) => Object.values(byOption).flat()).map(String));
    const attrs = Object.values(cfg.attributes);
    const optionLabel = {};
    for (const a of attrs) for (const o of a.options) optionLabel[`${a.id}:${o.id}`] = o.label;
    variants = Object.entries(cfg.index).map(([childId, combo]) => {
      let colour = null;
      let colourHex = null;
      const other = [];
      for (const a of attrs) {
        const label = optionLabel[`${a.id}:${combo[a.id]}`] ?? "";
        if (/colou?r/i.test(a.code)) {
          colour = label;
          const sw = swatches?.[a.id]?.[combo[a.id]];
          if (sw?.type === "1" && /^#[0-9a-f]{3,6}$/i.test(sw.value)) colourHex = sw.value;
        } else other.push({ code: a.code, label });
      }
      return {
        sourceId: childId,
        sourceSku: cfg.sku?.[childId] ?? null,
        colour,
        colourHex,
        sizeKind: other.map((o) => o.code).join("+") || null,
        size: other.map((o) => o.label).join(" / ") || null,
        price: cfg.optionPrices?.[childId]?.finalPrice?.amount ?? null,
        inStock: salable.has(childId),
      };
    });
  }

  const offer = Array.isArray(ld.offers) ? ld.offers[0] : ld.offers;
  const simpleInStock = /schema\.org\/InStock/.test(offer?.availability ?? "") || /class="availability">instock/.test(html);
  const currency = offer?.priceCurrency ?? null;

  return {
    sourceUrl: url,
    sourceSku: String(ld.sku ?? gaItem.item_id ?? ""),
    rawName: h1,
    name,
    mpn,
    brand: ld.brand?.name ?? layer?.brand ?? attr("Brand"),
    sourceCategory: [gaItem.item_category, ld.category, attr("Product")].filter(Boolean).join(" | "),
    sourceAudience: layer?.age ?? attr("User") ?? "",
    attributes,
    description,
    images,
    currency,
    price: offer?.price != null ? Number(offer.price) : null,
    inStock: variants ? variants.some((v) => v.inStock) : simpleInStock,
    variants,
    // For the report only — never imported.
    ignoredBadges: [...new Set([...html.matchAll(/product-label__([a-z]+)/g)].map((m) => m[1]))],
  };
}

// ---------- classification ----------

/** Our category from the source's own category fields; null = unknown, "excluded:<why>" = never imported. */
export function classify(rec) {
  const name = rec.rawName.toLowerCase();
  const cat = rec.sourceCategory.toLowerCase();
  const both = `${cat} ${name}`;
  if (/pickleball/.test(both)) return "excluded:pickleball";
  if (/beach\s*tennis|palas? de playa/.test(both)) return "excluded:beach-tennis";
  if (/gift\s*card|gift\s*voucher|tarjeta regalo/.test(both)) return "excluded:gift-card";
  if (/\bpacks?\b/.test(cat) || /^(duo |trio )?pack\b/.test(name) || / \+ /.test(name)) return "excluded:pack";
  const labels = new Set(rec.attributes.map((a) => a.label.toLowerCase()));
  if (/racket|pala\b/.test(cat) && !/bag|cover|funda|protector|grip/.test(cat)) return "rackets";
  if (!cat && labels.has("shape") && labels.has("core")) return "rackets";
  if (/shoe|footwear|zapatill|sneaker/.test(cat)) return "shoes";
  if (/bag|backpack|rucksack|paletero|mochila|trolley/.test(cat)) return "bags";
  if (/\bballs?\b|pelotas?/.test(cat) && !/pick.?up|basket|tube|holder/.test(both)) return "balls";
  if (/cloth|textile|apparel|shirt|polo|short|skirt|dress|sweat|jacket|trouser|pants|legging|top|sock|underwear|vest/.test(cat)) return "apparel";
  if (/accessor|overgrip|grip|protector|wristband|cap|visor|headband|towel|bottle|antivib|cover|tube|basket|holder|lead|tape/.test(cat)) return "accessories";
  // Some pages carry no category at all: fall back to the product name.
  if (!cat) {
    if (/\b(t-shirt|shirt|polo|shorts?|skirt|dress|sweatshirt|hoodie|jacket|trousers|pants|leggings|tank top|socks?)\b/.test(name)) return "apparel";
    if (/\b(wristbands?|caps?|visor|headband|overgrips?|grips?|protector|towel|bottle|dampener)\b/.test(name)) return "accessories";
    if (/\b(padelbag|bag|backpack|rucksack|trolley)\b/.test(name)) return "bags";
  }
  return null;
}

/** Source audience → ours. Wearables follow the source; for rackets/balls/bags/accessories "Man" means adult, i.e. unisex. */
export function audienceOf(rec, category) {
  const wearable = category === "shoes" || category === "apparel";
  let a = `${rec.sourceAudience} ${rec.rawName}`.toLowerCase();
  // No audience on the page: wearables usually say "for men" / "for women" early in the description.
  if (!rec.sourceAudience && wearable) {
    const intro = rec.description.slice(0, 3).map((b) => b.text ?? "").join(" ").toLowerCase();
    if (/\bfor (wo)?men\b|\b(wo)?men's\b/.test(intro)) a += /\bfor women\b|\bwomen's\b/.test(intro) ? " woman" : " man";
  }
  const man = /\bman\b|\bmen\b|\bmale\b|hombre/.test(a);
  const woman = /woman|women|female|lady|mujer/.test(a);
  if (/junior|\bkids?\b|child|\bboys?\b|\bgirls?\b|\bjr\b|niñ/.test(a)) return "kids";
  if ((man && woman) || /unisex/.test(a)) return "unisex";
  if (woman) return "women";
  if (man) return wearable ? "men" : "unisex";
  return "unisex";
}
