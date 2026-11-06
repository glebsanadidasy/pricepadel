import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { answerCookies, simpleProduct } from "./helpers";

test.beforeEach(async ({ context }) => answerCookies(context));

/**
 * Colour galleries: when a product has photos per colour, choosing a colour switches the gallery.
 * The test copy of the catalogue gets one product with two colours (the server re-reads changed files).
 */
test("choosing a colour switches the gallery", async ({ page }) => {
  const DATA = process.env.TEST_DATA_DIR!;
  const productsFile = path.join(DATA, "catalog/products.json");
  const offersFile = path.join(DATA, "sources/pn-uk/offers.json");
  const products = JSON.parse(fs.readFileSync(productsFile, "utf8"));
  const offers = JSON.parse(fs.readFileSync(offersFile, "utf8"));
  const base = simpleProduct();
  const p = products.find((x: { id: string }) => x.id === base.id);
  const [first, ...rest] = p.images as { src: string; colour: string | null }[];
  if (rest.length === 0) test.skip(true, "needs a product with at least two photos");
  const v = p.variants[0];
  p.variants = [
    { ...v, sku: `${v.sku}-TA`, colour: "Teal", colourHex: "#1fb5ad" },
    { ...v, sku: `${v.sku}-CO`, colour: "Coral", colourHex: "#ff7f6b" },
  ];
  p.images = [{ ...first, colour: "Teal" }, ...rest.map((i) => ({ ...i, colour: "Coral" }))];
  const o = offers[p.id].variants[v.sku];
  offers[p.id].variants = { [`${v.sku}-TA`]: o, [`${v.sku}-CO`]: o };
  fs.writeFileSync(productsFile, JSON.stringify(products));
  fs.writeFileSync(offersFile, JSON.stringify(offers));

  await page.goto(`/product/${p.slug}`);
  const main = page.locator("img[preload], main img").first();
  await page.getByRole("radio", { name: "Teal" }).check({ force: true });
  await expect(main).toHaveAttribute("src", new RegExp(encodeURIComponent(first.src).replace(/%2F/g, "(%2F|/)")));
  await page.getByRole("radio", { name: "Coral" }).check({ force: true });
  await expect(main).toHaveAttribute("src", new RegExp(encodeURIComponent(rest[0].src).replace(/%2F/g, "(%2F|/)")));
  await expect(page.getByRole("list", { name: "Product photos" }).getByRole("listitem")).toHaveCount(rest.length > 1 ? rest.length : 0);
});
