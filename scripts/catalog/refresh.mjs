// Price and stock refresh for imported products — re-reads product pages only, never downloads photos.
//   node scripts/catalog/refresh.mjs
// Same rules as the collector: robots.txt, 1 request per second, stop on block / captcha / 403 / 429.
// Resumes an interrupted run from .source-data/refresh-state.json.
import path from "node:path";
import { fetchPage, loadRobots, saveStop, stats, StopError } from "./lib/http.mjs";
import { parseProductPage } from "./lib/parse.mjs";
import { CATALOG_FILE, RAW_DIR, readJson, writeJson } from "./lib/store.mjs";

const RUN_FILE = path.join(RAW_DIR, "refresh-state.json");

async function main() {
  await loadRobots();
  const items = readJson(CATALOG_FILE, []);
  const run = readJson(RUN_FILE, null) ?? { startedAt: new Date().toISOString(), done: [] };
  const done = new Set(run.done);
  let changed = 0;
  let errorsInRow = 0;

  for (const item of items) {
    if (done.has(item.id)) continue;
    let page;
    try {
      page = await fetchPage(item.sourceUrl);
      errorsInRow = 0;
    } catch (err) {
      if (err instanceof StopError) throw err;
      if (++errorsInRow >= 5) throw new StopError(`Five errors in a row (last: ${err.message}). Refresh stopped.`);
      console.log(`error    ${item.name}: ${err.message}`);
      continue;
    }
    const before = JSON.stringify(item.variants.map((v) => [v.sourcePrice, v.inStock]));
    const rec = page.status === 200 ? parseProductPage(page.html, page.url) : null;
    if (!rec) {
      // Page gone: nothing can be bought from the source any more.
      for (const v of item.variants) v.inStock = false;
    } else {
      const bySourceId = new Map((rec.variants ?? []).map((v) => [String(v.sourceId), v]));
      for (const v of item.variants) {
        const src = v.sourceVariantId ? bySourceId.get(String(v.sourceVariantId)) : { price: rec.price, inStock: rec.inStock };
        v.inStock = !!src?.inStock;
        if (src?.price != null) v.sourcePrice = Math.round(src.price * 100);
      }
    }
    item.priceCheckedAt = new Date().toISOString();
    if (JSON.stringify(item.variants.map((v) => [v.sourcePrice, v.inStock])) !== before) changed++;
    writeJson(CATALOG_FILE, items);
    run.done.push(item.id);
    writeJson(RUN_FILE, run);
    console.log(`[${stats().requests} req] ${item.name}: ${item.variants.filter((v) => v.inStock).length}/${item.variants.length} variants in stock`);
  }
  writeJson(RUN_FILE, null);
  console.log(`Refresh finished: ${items.length} products checked, ${changed} changed.`);
}

main().catch((err) => {
  if (err instanceof StopError) {
    saveStop(err);
    console.error(`\nSTOPPED: ${err.message}\nProgress is saved; run the same command again later to continue.`);
    process.exit(2);
  }
  console.error(err);
  process.exit(1);
});
