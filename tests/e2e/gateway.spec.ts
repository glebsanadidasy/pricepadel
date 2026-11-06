import { expect, test, type Page } from "@playwright/test";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import http from "node:http";
import { gatewayConfig } from "../../src/lib/gateway-config";
import { addToCart, answerCookies, mails, registerAndVerify, retailOf, simpleProduct, uniqueEmail, deliveryFor } from "./helpers";

/**
 * Card gateway (redirect flow) against a local TEST DOUBLE of the gateway API — never the real gateway, no real keys.
 * The shop under test runs on its own server (TEST_GW_BASE) configured for this double.
 */
const BASE = process.env.TEST_GW_BASE!;
const SECRET = process.env.TEST_GATEWAY_SECRET!;
const FAKE_PORT = Number(process.env.TEST_FAKE_GATEWAY_PORT);
test.use({ baseURL: BASE });
test.describe.configure({ mode: "serial" });

type Created = { id: string; body: Record<string, unknown> & { amount: number; currency: string; redirect_url: string; webhook_url: string; items: unknown[] } };
const created: Created[] = [];
let server: http.Server;

test.beforeAll(async () => {
  server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      if (req.method === "POST" && req.url === "/api/orders") {
        if (req.headers.authorization !== "Bearer test-token-not-real") return void res.writeHead(401).end("{}");
        const id = `gw_${crypto.randomBytes(6).toString("hex")}`;
        created.push({ id, body: JSON.parse(raw) });
        res.writeHead(201, { "content-type": "application/json" }).end(JSON.stringify({ checkout_url: `http://localhost:${FAKE_PORT}/pay/${id}`, public_order_id: id }));
      } else if (req.method === "GET" && req.url?.startsWith("/pay/")) {
        const c = created.find((x) => req.url === `/pay/${x.id}`);
        res.writeHead(200, { "content-type": "text/html" }).end(`<h1>Gateway test double</h1><a href="${c?.body.redirect_url}">Return to shop</a>`);
      } else res.writeHead(404).end("{}");
    });
  });
  await new Promise<void>((r) => server.listen(FAKE_PORT, r));
});
test.afterAll(() => server.close());
test.beforeEach(async ({ context }) => answerCookies(context));

const product = simpleProduct();
const total = retailOf(product.sourcePrice) + deliveryFor(retailOf(product.sourcePrice));

async function orderToGateway(page: Page) {
  await registerAndVerify(page, uniqueEmail("gw"));
  await addToCart(page, product.slug);
  await page.goto("/checkout");
  await page.getByLabel("Full name").fill("Gateway Tester");
  await page.getByLabel("Address line 1").fill("1 Test Street");
  await page.getByLabel("City").fill("London");
  await page.getByLabel("Postcode").fill("SW1A 1AA");
  await page.getByRole("button", { name: "Save address" }).click();
  await page.getByLabel(/I have read and accept/).check();
  await page.getByRole("button", { name: "Pay by card" }).click();
  await page.waitForURL(new RegExp(`localhost:${FAKE_PORT}/pay/`));
  const c = created[created.length - 1];
  const number = new URL(c.body.redirect_url).searchParams.get("order")!;
  return { c, number };
}

const sign = (id: string, amount: string | number, secret = SECRET) => crypto.createHmac("sha256", secret).update(`${id}${amount}`).digest("hex");
const notify = (page: Page, body: Record<string, unknown>, signature?: string) =>
  page.request.post(`${BASE}/api/payments/notify`, { data: JSON.stringify(body), headers: { "content-type": "application/json", ...(signature !== undefined ? { "x-webhook-signature": signature } : {}) } });

async function statusOf(page: Page, number: string) {
  await page.goto(`/account/orders/${number}`);
  return (await page.getByTestId("order-status").textContent())!.trim();
}

test("redirect flow: server-side amount, return without notification, every bad notification refused, then Paid once", async ({ page }) => {
  const { c, number } = await orderToGateway(page);
  // The gateway got the amount computed by the server from the stored order.
  expect(Math.round(c.body.amount * 100)).toBe(total);
  expect(c.body.currency).toBe("GBP");
  expect(c.body.webhook_url).toBe(`${BASE}/api/payments/notify`);
  expect(Array.isArray(c.body.items) && c.body.items.length).toBeTruthy();

  // Coming back without a notification proves nothing: the page says the payment is being checked.
  await page.getByRole("link", { name: "Return to shop" }).click();
  await expect(page.getByText(/We’re checking your payment/)).toBeVisible();
  expect(await statusOf(page, number)).toBe("Awaiting payment");

  const amount = (total / 100).toFixed(2);
  const good = { public_order_id: c.id, amount: Number(amount), currency: "GBP", status: "success" };
  expect((await notify(page, good, "")).status()).toBe(401); // empty signature
  expect((await notify(page, good)).status()).toBe(401); // no signature
  expect((await notify(page, good, sign(c.id, amount, "f".repeat(64)))).status()).toBe(401); // wrong secret
  expect((await notify(page, { ...good, amount: 0.01 }, sign(c.id, "0.01"))).status()).toBe(400); // wrong amount, validly signed
  expect((await notify(page, { ...good, currency: "EUR" }, sign(c.id, amount))).status()).toBe(400); // wrong currency
  expect((await notify(page, { ...good, public_order_id: "gw_unknown" }, sign("gw_unknown", amount))).status()).toBe(404); // unknown order
  expect(await statusOf(page, number)).toBe("Awaiting payment");

  expect((await notify(page, good, sign(c.id, Number(amount)))).status()).toBe(200);
  expect(await statusOf(page, number)).toBe("Paid");
  const paidMails = mails().filter((m) => m.subject.includes(number)).length;

  // A repeat changes nothing; a later failure or cancel never undoes Paid.
  expect((await notify(page, good, sign(c.id, Number(amount)))).status()).toBe(200);
  expect((await notify(page, { ...good, status: "failed" }, sign(c.id, Number(amount)))).status()).toBe(200);
  expect((await notify(page, { ...good, status: "canceled" }, sign(c.id, Number(amount)))).status()).toBe(200);
  expect(await statusOf(page, number)).toBe("Paid");
  expect(mails().filter((m) => m.subject.includes(number)).length).toBe(paidMails);
});

test("a price changed in the browser is never sent to the gateway", async ({ page }) => {
  await registerAndVerify(page, uniqueEmail("gwtamper"));
  await addToCart(page, product.slug);
  await page.goto("/checkout");
  await page.getByLabel("Full name").fill("Gateway Tester");
  await page.getByLabel("Address line 1").fill("1 Test Street");
  await page.getByLabel("City").fill("London");
  await page.getByLabel("Postcode").fill("SW1A 1AA");
  await page.getByRole("button", { name: "Save address" }).click();
  await expect(page.getByRole("radio", { name: /Test Street/ })).toBeVisible();
  const before = created.length;
  await page.locator("input[name=expected]").evaluate((e: HTMLInputElement) => (e.value = "GBP:£0.01"));
  await page.getByLabel(/I have read and accept/).check();
  await page.getByRole("button", { name: "Pay by card" }).click();
  await expect(page.getByText(/Prices or stock changed/)).toBeVisible();
  expect(created.length).toBe(before);
});

test("live mode stays blocked and unsafe settings are refused", () => {
  const base = { PAYMENT_API_BASE_URL: "https://gateway.example", PAYMENT_API_TOKEN: "t", PAYMENT_WEBHOOK_SECRET: "s", PAYMENT_MODE: "live" };
  expect(gatewayConfig({ ...base, PAYMENT_LIVE_ENABLED: "false" })).toMatchObject({ ok: false, reason: expect.stringContaining("live mode is blocked") });
  expect(gatewayConfig({ ...base })).toMatchObject({ ok: false });
  expect(gatewayConfig({ ...base, PAYMENT_MODE: "test", PAYMENT_WEBHOOK_SECRET: "" })).toMatchObject({ ok: false, reason: "webhook secret missing" });
  expect(gatewayConfig({ ...base, PAYMENT_MODE: "test", PAYMENT_API_BASE_URL: "http://gateway.example" })).toMatchObject({ ok: false });
  expect(gatewayConfig({ ...base, PAYMENT_MODE: "test" })).toMatchObject({ ok: true, mode: "test" });
});

test("without a webhook secret every notification is refused", async ({ request }) => {
  // The main test server has no gateway secret at all.
  const r = await request.post("http://localhost:3200/api/payments/notify", {
    data: JSON.stringify({ public_order_id: "x", amount: 1, currency: "GBP", status: "success" }),
    headers: { "content-type": "application/json", "x-webhook-signature": "0".repeat(64) },
  });
  expect(r.status()).toBe(503);
});

test("the gateway provider is never named in pages, e-mails or the repository", async ({ page }) => {
  const NAME = /ex[-_ ]?payments|wallet\.ex/i;
  for (const url of ["/", "/shop", `/product/${product.slug}`, "/cart", "/policies/payment", "/policies/privacy", "/policies/cookies", "/faq", "/contact"]) {
    await page.goto(url);
    expect(await page.content(), url).not.toMatch(NAME);
  }
  for (const m of mails()) expect(`${m.subject} ${m.text}`).not.toMatch(NAME);
  // git grep exits 1 when nothing matches — that is the expected result.
  const r = spawnSync("git", ["grep", "-il", "-E", "ex[-_ ]?payments|wallet\\.ex", "--", "."], { encoding: "utf8", cwd: process.cwd() });
  expect(r.stdout.trim()).toBe("");
  expect(r.status).toBe(1);
});
