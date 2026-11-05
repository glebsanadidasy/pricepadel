// Full-page screenshots for comparing with the Figma mockup: node scripts/screenshots.mjs [outDir] [path...]
import { chromium } from "playwright-core";
import fs from "node:fs";

const base = process.env.BASE_URL || "http://localhost:3100";
const out = process.argv[2] || "test-results/screens";
const paths = process.argv.slice(3).length ? process.argv.slice(3) : ["/", "/shop", "/product/bullpadel-mens-indiga-26v-padel-shoes-white"];
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
for (const width of [1920, 390]) {
  const page = await browser.newPage({ viewport: { width, height: width > 500 ? 1080 : 780 }, deviceScaleFactor: 1 });
  for (const p of paths) {
    await page.goto(base + p, { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(600);
    const name = `${p === "/" ? "home" : p.replace(/\//g, "_").replace(/^_/, "")}-${width}.png`;
    await page.screenshot({ path: `${out}/${name}`, fullPage: true });
    console.log(name, await page.evaluate(() => document.documentElement.scrollWidth));
  }
  await page.close();
}
await browser.close();
