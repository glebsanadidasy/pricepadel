// File locations for the catalogue pipeline. Raw source data stays in .source-data/ (git-ignored).
import fs from "node:fs";
import path from "node:path";

export const ROOT = process.cwd();
export const RAW_DIR = path.join(ROOT, ".source-data");
export const RECORDS_DIR = path.join(RAW_DIR, "records"); // one parsed record per source page
export const ORIGINALS_DIR = path.join(RAW_DIR, "photos"); // original photos as downloaded
export const REVIEW_DIR = path.join(RAW_DIR, "review"); // contact sheets for the photo check
export const STATE_FILE = path.join(RAW_DIR, "state.json");

export const CATALOG_DIR = path.join(ROOT, "data", "catalog");
export const CATALOG_FILE = path.join(CATALOG_DIR, "products.json"); // imported catalogue (server-only; holds admin fields)
export const SETTINGS_FILE = path.join(CATALOG_DIR, "settings.json"); // markups, delivery, hidden sources
export const PHOTO_REVIEW_FILE = path.join(CATALOG_DIR, "photo-review.json"); // rejected photos and why
export const PUBLIC_PHOTOS_DIR = path.join(ROOT, "public", "images", "products");

export const SOURCE = { id: "pn-uk", name: "Padel Nuestro (UK store)" };

for (const d of [RAW_DIR, RECORDS_DIR, ORIGINALS_DIR, REVIEW_DIR, CATALOG_DIR]) fs.mkdirSync(d, { recursive: true });

export function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

/** Atomic write, so an interrupted run never leaves a half-written file. */
export function writeJson(file, data) {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n");
  fs.renameSync(tmp, file);
}

export function recordFile(key) {
  return path.join(RECORDS_DIR, `${key}.json`);
}
