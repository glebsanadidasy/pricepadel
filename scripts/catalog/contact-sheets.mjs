// Contact sheets for the manual photo check (people / overlaid text / source logo).
//   node scripts/catalog/contact-sheets.mjs   → .source-data/review/sheet-NN.jpg + sheet-index.json
// Decisions go into data/catalog/photo-review.json: "reviewed": { key: true }, "rejected": { "key/n": "reason" }.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { PHOTO_REVIEW_FILE, RAW_DIR, readJson, recordFile, REVIEW_DIR, STATE_FILE, writeJson } from "./lib/store.mjs";

const TILE = 340;
const COLS = 4;
const ROWS = 4;
const onlyNew = !process.argv.includes("--all");

const state = readJson(STATE_FILE, { processed: {} });
const review = readJson(PHOTO_REVIEW_FILE, { reviewed: {}, rejected: {} });
const photos = [];
for (const p of Object.values(state.processed)) {
  if (p.status !== "accepted" || (onlyNew && review.reviewed[p.key])) continue;
  const rec = readJson(recordFile(p.key), null);
  rec?.images.forEach((img, i) => photos.push({ ref: `${p.key}/${i + 1}`, file: path.join(RAW_DIR, img.file) }));
}

for (const f of fs.readdirSync(REVIEW_DIR)) fs.rmSync(path.join(REVIEW_DIR, f));
const perSheet = COLS * ROWS;
const index = {};
for (let s = 0; s * perSheet < photos.length; s++) {
  const batch = photos.slice(s * perSheet, (s + 1) * perSheet);
  const composites = [];
  for (const [i, ph] of batch.entries()) {
    const x = (i % COLS) * TILE;
    const y = Math.floor(i / COLS) * (TILE + 24);
    const img = await sharp(ph.file).resize(TILE - 8, TILE - 8, { fit: "contain", background: "#ffffff" }).flatten({ background: "#ffffff" }).toBuffer();
    const label = Buffer.from(`<svg width="${TILE}" height="24"><rect width="100%" height="100%" fill="#222"/><text x="6" y="17" font-size="15" font-family="Arial" fill="#ff0">${i + 1}: ${ph.ref}</text></svg>`);
    composites.push({ input: label, left: x, top: y }, { input: img, left: x + 4, top: y + 28 });
  }
  const name = `sheet-${String(s + 1).padStart(2, "0")}.jpg`;
  await sharp({ create: { width: COLS * TILE, height: ROWS * (TILE + 24) + 8, channels: 3, background: "#999" } }).composite(composites).jpeg({ quality: 80 }).toFile(path.join(REVIEW_DIR, name));
  index[name] = batch.map((b) => b.ref);
}
writeJson(path.join(REVIEW_DIR, "sheet-index.json"), index);
console.log(`${photos.length} photos on ${Object.keys(index).length} sheets in ${REVIEW_DIR}`);
