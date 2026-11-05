// File locations for the catalogue pipeline.
//   .source-data/  raw collection data (pages parsed to records, original photos, state) — never in Git
//   sources/       supplier data the admin panel needs (source links, prices, SKUs, reports) — never in Git
//   data/catalog/  public catalogue + settings — in Git
// CATALOG_DIR / SOURCES_DIR / PUBLIC_PHOTOS_DIR can point elsewhere (tests run on a copy).
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const ROOT = process.cwd();
export const RAW_DIR = path.join(ROOT, ".source-data");
export const RECORDS_DIR = path.join(RAW_DIR, "records"); // one parsed record per source page
export const ORIGINALS_DIR = path.join(RAW_DIR, "photos"); // original photos as downloaded
export const REVIEW_DIR = path.join(RAW_DIR, "review"); // contact sheets (manual check, no longer required)
export const STATE_FILE = path.join(RAW_DIR, "state.json");
export const OCR_BIN = path.join(RAW_DIR, "bin", "ocr");

export const SOURCES_DIR = path.resolve(process.env.SOURCES_DIR || path.join(ROOT, "sources"));
export const SOURCE_REGISTRY_FILE = path.join(SOURCES_DIR, "sources.json"); // source id → name, site
export const PHOTO_CHECKS_FILE = path.join(SOURCES_DIR, "photo-checks.json"); // automatic photo checks (cache)
export const IMPORT_REPORT_FILE = path.join(SOURCES_DIR, "import-report.md");
export const offersFile = (sourceId) => path.join(SOURCES_DIR, sourceId, "offers.json"); // prices, stock, links

export const CATALOG_DIR = path.resolve(process.env.CATALOG_DIR || path.join(ROOT, "data", "catalog"));
export const CATALOG_FILE = path.join(CATALOG_DIR, "products.json"); // public catalogue
export const SETTINGS_FILE = path.join(CATALOG_DIR, "settings.json"); // markups, rates, delivery cost, hidden sources
export const PUBLIC_PHOTOS_DIR = path.resolve(process.env.PUBLIC_PHOTOS_DIR || path.join(ROOT, "public", "images", "products"));

export const SOURCE = { id: "pn-uk", name: "Padel Nuestro (UK store)", url: "https://www.padelnuestro.com/uk/" };

for (const d of [RAW_DIR, RECORDS_DIR, ORIGINALS_DIR, REVIEW_DIR, CATALOG_DIR, path.join(SOURCES_DIR, SOURCE.id)]) fs.mkdirSync(d, { recursive: true });

export function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

/** Atomic write, so an interrupted run never leaves a half-written file. */
export function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n");
  fs.renameSync(tmp, file);
}

export function recordFile(key) {
  return path.join(RECORDS_DIR, `${key}.json`);
}

/** Public photo path: two-hex-digit sub-folder (256 folders) keeps every folder far below 3000 files. */
export function publicPhotoPath(fileName) {
  const bucket = crypto.createHash("sha1").update(fileName).digest("hex").slice(0, 2);
  return { rel: `${bucket}/${fileName}`, src: `/images/products/${bucket}/${fileName}`, abs: path.join(PUBLIC_PHOTOS_DIR, bucket, fileName) };
}
