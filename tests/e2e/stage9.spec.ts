import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { addToCart, answerCookies, retailOf, simpleProduct } from "./helpers";

/** EUR-only shop and the "Pay by Wallet" button. The test copy's settings are switched to EUR only and restored afterwards. */
const settingsFile = path.join(process.env.TEST_DATA_DIR!, "catalog", "settings.json");
let original = "";

test.beforeAll(() => {
  original = fs.readFileSync(settingsFile, "utf8");
  const s = JSON.parse(original);
  s.currencies = ["EUR"]; // EUR has a fresh manual rate of 1.2 in the test copy
  fs.writeFileSync(settingsFile, JSON.stringify(s, null, 2));
});
test.afterAll(() => fs.writeFileSync(settingsFile, original));
test.beforeEach(async ({ context }) => answerCookies(context));

test("EUR only: prices and checkout in euros, no currency menu, Pay by Wallet with its logo", async ({ page }) => {
  const product = simpleProduct();
  const eur = Math.round(retailOf(product.sourcePrice) * 1.2);
  const euro = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(eur / 100);
  await page.goto(`/product/${product.slug}`);
  await expect(page.getByText(euro).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Currency:/ })).toHaveCount(0);
  await expect(page.getByLabel("Prices in Euro (€)").first()).toBeVisible();

  await addToCart(page, product.slug);
  await page.goto("/checkout");
  await expect(page.getByText("Charged in EUR.", { exact: false })).toBeVisible();
  const pay = page.getByRole("button", { name: "Pay by Wallet" });
  await expect(pay).toBeVisible();
  await expect(pay.locator("img")).toHaveAttribute("src", "/images/payment/wallet.png");
  await expect(page.getByRole("button", { name: "Pay by card" })).toHaveCount(0);

  await page.goto("/policies/payment");
  await expect(page.getByText(/shown and charged in euros \(€\)/).first()).toBeVisible();
});
