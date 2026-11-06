import { expect, type Page } from "@playwright/test";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const DATA = process.env.TEST_DATA_DIR!;
const OUTBOX = path.join(DATA, "outbox");

type Mail = { to: string; subject: string; text: string; at: string };

export function mails(): Mail[] {
  if (!fs.existsSync(OUTBOX)) return [];
  return fs
    .readdirSync(OUTBOX)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(OUTBOX, f), "utf8")) as Mail);
}

export const uniqueEmail = (tag: string) => `${tag}-${Date.now()}-${crypto.randomBytes(2).toString("hex")}@example.test`;

/** A product on sale with a single in-stock variant (simplest to buy), taken from the test copy of the catalogue. */
export function simpleProduct(minRetail = 0, maxRetail = Infinity) {
  const products = JSON.parse(fs.readFileSync(path.join(DATA, "catalog/products.json"), "utf8")) as {
    id: string;
    slug: string;
    name: string;
    hidden: boolean;
    images: unknown[];
    variants: { sku: string; size: string | null }[];
  }[];
  const offers = JSON.parse(fs.readFileSync(path.join(DATA, "sources/pn-uk/offers.json"), "utf8")) as Record<string, { variants: Record<string, { inStock: boolean; sourcePrice: number }> }>;
  const retail = (x: (typeof products)[number]) => retailOf(offers[x.id].variants[x.variants[0].sku].sourcePrice);
  const p = products.find(
    (x) =>
      !x.hidden &&
      x.images.length > 0 &&
      x.variants.length === 1 &&
      !x.variants[0].size &&
      offers[x.id]?.variants[x.variants[0].sku]?.inStock &&
      retail(x) >= minRetail &&
      retail(x) < maxRetail,
  );
  if (!p) throw new Error(`No simple in-stock product between ${minRetail} and ${maxRetail} pence in the test catalogue`);
  return { ...p, sourcePrice: offers[p.id].variants[p.variants[0].sku].sourcePrice };
}

/** Default price rule: the larger of source × 1.15 and source + £3. */
export const retailOf = (source: number) => Math.max(Math.round(source * 1.15), source + 300);

export const PASSWORD = "correct horse battery";

/** Registers, confirms the e-mail through the link in the outbox, and stays signed in. */
export async function registerAndVerify(page: Page, email: string) {
  await page.goto("/account/register");
  await page.getByLabel("Name").fill("Test Customer");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/account\?welcome=1/);
  const mail = mails().reverse().find((m) => m.to === email && /Confirm your e-mail/.test(m.subject));
  expect(mail, "confirmation e-mail in the outbox").toBeTruthy();
  const link = mail!.text.match(/https?:\/\/\S+\/account\/verify\?token=\S+/)![0];
  await page.goto(link.replace(/^https?:\/\/[^/]+/, ""));
  await expect(page.getByText("your e-mail is confirmed")).toBeVisible();
}

export async function addToCart(page: Page, slug: string) {
  await page.goto(`/product/${slug}`);
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Added to your cart." })).toBeVisible();
}

/** From the cart to the gateway page: adds an address, accepts the Terms, pays by card. Returns the order number. */
export async function checkoutToGateway(page: Page) {
  await page.goto("/checkout");
  if (await page.getByRole("radio", { name: /Test Street/ }).count() === 0) {
    await page.getByLabel("Full name").fill("Test Customer");
    await page.getByLabel("Address line 1").fill("1 Test Street");
    await page.getByLabel("City").fill("London");
    await page.getByLabel("Postcode").fill("SW1A 1AA");
    await page.getByRole("button", { name: "Save address" }).click();
    await expect(page.getByRole("radio", { name: /Test Street/ })).toBeVisible();
  }
  await page.getByLabel(/I have read and accept/).check();
  await page.getByRole("button", { name: "Pay by card" }).click();
  await expect(page.getByText("Test payment page — simulation").first()).toBeVisible();
  const heading = await page.getByText(/Order PP\d+/).textContent();
  return heading!.match(/PP\d+/)![0];
}

export async function orderStatus(page: Page, number: string) {
  await page.goto(`/account/orders/${number}`);
  return (await page.getByTestId("order-status").textContent())!.trim();
}

export function signedNotification(body: object, secret = process.env.TEST_WEBHOOK_SECRET!) {
  const raw = JSON.stringify(body);
  const t = Math.floor(Date.now() / 1000);
  const mac = crypto.createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex");
  return { raw, signature: `t=${t},v1=${mac}` };
}

export function paymentIdFromUrl(url: string) {
  return url.match(/mock-gateway\/(pay_[0-9a-f]+)/)![1];
}

/** Customer delivery for a GBP subtotal, as in the default settings (£12.95 under £100, free from £100). */
export const deliveryFor = (subtotal: number) => (subtotal >= 10000 ? 0 : 1295);

/** The cookie notice is tested on its own; elsewhere it is answered up front so it never covers buttons. */
export async function answerCookies(context: import("@playwright/test").BrowserContext) {
  await context.addCookies([{ name: "pp_consent", value: "rejected", url: "http://localhost:3200" }]);
}
