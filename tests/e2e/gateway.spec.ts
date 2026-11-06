import { expect, test, type Page } from "@playwright/test";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import http from "node:http";
import { apiRoot, checkoutUrlAllowed, gatewayConfig } from "../../src/lib/gateway-config";
import { addToCart, answerCookies, deliveryFor, mails, registerAndVerify, retailOf, simpleProduct, uniqueEmail, useOutbox } from "./helpers";

/**
 * Card gateway (redirect flow) against a local TEST DOUBLE of the gateway API — never the real gateway, no real keys.
 * The double answers like the documentation: 201 { public_order_id, status, expires_at, checkout_url }.
 * Special surnames steer it: "Expired" → expires_at in the past, "Evil" → checkout_url on a foreign host, "Invalid" → 422.
 */
const BASE = process.env.TEST_GW_BASE!;
const SECRET = process.env.TEST_GATEWAY_SECRET!;
const FAKE_PORT = Number(process.env.TEST_FAKE_GATEWAY_PORT);
test.use({ baseURL: BASE });
test.describe.configure({ mode: "serial" });

type Created = { id: string; raw: string; path: string; body: Record<string, any> };
const created: Created[] = [];
let server: http.Server;

test.beforeAll(async () => {
  useOutbox("outbox-gw");
  server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      if (req.method === "POST" && req.url?.endsWith("/orders")) {
        if (req.headers.authorization !== "Bearer test-token-not-real") return void res.writeHead(401).end("{}");
        const body = JSON.parse(raw);
        const surname = body.customer_details?.surname;
        if (surname === "Invalid") return void res.writeHead(422, { "content-type": "application/json" }).end(JSON.stringify({ errors: { phone: ["invalid"] }, echo: body.customer_details }));
        const id = `gw_${crypto.randomBytes(6).toString("hex")}`;
        created.push({ id, raw, path: req.url, body });
        const expires = surname === "Expired" ? new Date(Date.now() - 60000) : new Date(Date.now() + 30 * 60000);
        const checkout = surname === "Evil" ? `https://evil.example/pay/${id}` : `http://localhost:${FAKE_PORT}/pay/${id}`;
        res.writeHead(201, { "content-type": "application/json" }).end(JSON.stringify({ public_order_id: id, status: "pending", expires_at: expires.toISOString(), checkout_url: checkout }));
      } else if (req.method === "GET" && req.url?.startsWith("/pay/")) {
        const c = created.find((x) => req.url === `/pay/${x.id}`);
        res.writeHead(200, { "content-type": "text/html" }).end(`<h1>Gateway test double</h1><a href="${c?.body.redirect_url}">Return to shop</a>`);
      } else res.writeHead(404).end("{}");
    });
  });
  await new Promise<void>((r) => server.listen(FAKE_PORT, r));
});
test.afterAll(() => {
  useOutbox("outbox");
  server.close();
});
test.beforeEach(async ({ context }) => answerCookies(context));

const product = simpleProduct();
const total = retailOf(product.sourcePrice) + deliveryFor(retailOf(product.sourcePrice));
const amount = (total / 100).toFixed(2);

async function checkout(page: Page, surname = "Tester", register = true) {
  if (register) await registerAndVerify(page, uniqueEmail("gw"));
  await addToCart(page, product.slug);
  await page.goto("/checkout");
  await page.getByLabel("Full name").fill(`Gateway ${surname}`);
  await page.getByLabel("Phone").fill("+44 7700 900123");
  await page.getByLabel("Address line 1").fill("1 Test Street");
  await page.getByLabel("City").fill("London");
  await page.getByLabel("Postcode").fill("SW1A 1AA");
  await page.getByRole("button", { name: "Save address" }).click();
  await expect(page.getByRole("radio", { name: new RegExp(`Gateway ${surname}`) })).toBeVisible();
  await page.getByLabel(/I have read and accept/).check();
  const before = created.length;
  await page.getByRole("button", { name: "Pay by card" }).click();
  return { before };
}

async function orderToGateway(page: Page, surname = "Tester") {
  await checkout(page, surname);
  await page.waitForURL(new RegExp(`localhost:${FAKE_PORT}/pay/`));
  const c = created[created.length - 1];
  return { c, number: new URL(c.body.redirect_url).searchParams.get("order")! };
}

const sign = (id: string, amountText: string, secret = SECRET) => crypto.createHmac("sha256", secret).update(`${id}${amountText}`).digest("hex");
type Note = { event?: string; status: string; amount: string; currency?: string; public_order_id: string; signature?: string };
const paid = (id: string, extra: Partial<Note> = {}): Note => {
  const n = { event: "order.paid", status: "success", public_order_id: id, amount, currency: "GBP", timestamp: new Date().toISOString(), ...extra } as Note;
  return { ...n, signature: extra.signature ?? sign(n.public_order_id, n.amount) };
};
const notify = (page: Page, body: object | string, header?: string) =>
  page.request.post(`${BASE}/api/payments/notify`, {
    data: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": "application/json", ...(header ? { "x-webhook-signature": header } : {}) },
  });

async function statusOf(page: Page, number: string) {
  await page.goto(`/account/orders/${number}`);
  return (await page.getByTestId("order-status").textContent())!.trim();
}

test("settings: /api is added once, checkout hosts are enforced, live mode stays blocked", () => {
  for (const b of ["https://gw.example/api", "https://gw.example/api/", "https://gw.example", "https://gw.example/"]) expect(apiRoot(b)).toBe("https://gw.example/api");
  const base = { PAYMENT_API_BASE_URL: "https://gw.example/api", PAYMENT_API_TOKEN: "t", PAYMENT_WEBHOOK_SECRET: "s", PAYMENT_CHECKOUT_HOSTS: "pay.gw.example" };
  expect(gatewayConfig({ ...base, PAYMENT_MODE: "live", PAYMENT_LIVE_ENABLED: "false" })).toMatchObject({ ok: false, reason: expect.stringContaining("live mode is blocked") });
  expect(gatewayConfig({ ...base, PAYMENT_MODE: "live" })).toMatchObject({ ok: false });
  expect(gatewayConfig({ ...base, PAYMENT_WEBHOOK_SECRET: "" })).toMatchObject({ ok: false, reason: "webhook secret missing" });
  expect(gatewayConfig({ ...base, PAYMENT_CHECKOUT_HOSTS: "" })).toMatchObject({ ok: false });
  expect(gatewayConfig({ ...base, PAYMENT_API_BASE_URL: "http://gw.example" })).toMatchObject({ ok: false });
  expect(gatewayConfig({ ...base, PAYMENT_MODE: "test" })).toMatchObject({ ok: true, apiRoot: "https://gw.example/api" });
  const cfg = { mode: "live" as const, checkoutHosts: ["pay.gw.example"] };
  expect(checkoutUrlAllowed("https://pay.gw.example/c/1", cfg)).toBe(true);
  expect(checkoutUrlAllowed("http://pay.gw.example/c/1", cfg)).toBe(false);
  expect(checkoutUrlAllowed("https://evil.example/c/1", cfg)).toBe(false);
  expect(checkoutUrlAllowed("https://pay.gw.example.evil.example/c/1", cfg)).toBe(false);
});

test("request follows the documentation and the amount comes from the stored order", async ({ page }) => {
  const { c } = await orderToGateway(page);
  expect(c.path).toBe("/api/orders"); // configured with a trailing /api/ — no /api/api
  expect(c.raw).toMatch(/"amount":\d+\.\d{2}[,}]/); // a number with exactly 2 decimals
  expect(c.raw).toMatch(/"price":\d+\.\d{2}[,}]/);
  expect(c.body.amount.toFixed(2)).toBe(amount);
  expect(c.body.currency).toBe("GBP");
  expect(c.body.customer_details).toMatchObject({ name: "Gateway", surname: "Tester", phone: "+447700900123", country: "GB", address_line1: "1 Test Street" });
  expect(c.body.customer_details.email).toMatch(/@example\.test$/);
  const itemsTotal = c.body.items.reduce((n: number, i: { price: number }) => n + Math.round(i.price * 100), 0);
  expect(itemsTotal).toBe(total);
  if (deliveryFor(retailOf(product.sourcePrice)) > 0) expect(c.body.items.some((i: { name: string }) => i.name === "Delivery")).toBe(true);
  expect(c.body.webhook_url).toBe(`${BASE}/api/payments/notify`);
});

test("notifications: only a fully valid order.paid makes the order Paid, once", async ({ page }) => {
  const { c, number } = await orderToGateway(page);
  // Coming back without a notification proves nothing.
  await page.getByRole("link", { name: "Return to shop" }).click();
  await expect(page.getByText(/We’re checking your payment/)).toBeVisible();

  const good = paid(c.id);
  expect((await notify(page, { ...good, signature: "" })).status()).toBe(401); // empty signature
  expect((await notify(page, { ...good, signature: undefined })).status()).toBe(401); // none
  expect((await notify(page, paid(c.id, { signature: sign(c.id, amount, "f".repeat(64)) }))).status()).toBe(401); // wrong secret
  expect((await notify(page, { ...good, amount: Number(amount).toString() + "0" })).status()).toBe(401); // amount string differs from the signed one
  expect((await notify(page, paid(c.id, { amount: "0.01" }))).status()).toBe(400); // wrong amount, validly signed
  expect((await notify(page, paid(c.id, { currency: "EUR" }))).status()).toBe(400); // wrong currency
  expect((await notify(page, paid(c.id, { event: "order.created" }))).status()).toBe(400); // success without order.paid
  expect((await notify(page, paid(c.id, { status: "refunded" }))).status()).toBe(400); // unknown status
  expect((await notify(page, paid("gw_unknown"))).status()).toBe(404); // unknown order
  expect((await notify(page, paid(c.id, { status: "pending", event: "order.pending" }))).status()).toBe(200); // pending changes nothing
  expect(await statusOf(page, number)).toBe("Awaiting payment");

  // Header fallback when the body has no signature.
  const { signature, ...unsigned } = good;
  expect((await notify(page, unsigned, signature)).status()).toBe(200);
  expect(await statusOf(page, number)).toBe("Paid");
  const count = mails().filter((m) => m.subject.includes(number)).length;

  expect((await notify(page, good)).status()).toBe(200); // repeat
  expect((await notify(page, paid(c.id, { status: "failed", event: "order.failed" }))).status()).toBe(200);
  expect((await notify(page, paid(c.id, { status: "expired", event: "order.expired" }))).status()).toBe(200);
  expect(await statusOf(page, number)).toBe("Paid");
  expect(mails().filter((m) => m.subject.includes(number)).length).toBe(count);
});

test("an expired payment page: order Expired, order again, a late payment goes to the admin for a manual check", async ({ page, browser }) => {
  const { c, number } = await orderToGateway(page, "Expired");
  expect(await statusOf(page, number)).toBe("Expired");
  await expect(page.getByRole("button", { name: "Order again" })).toBeVisible();

  expect((await notify(page, paid(c.id))).status()).toBe(200);
  expect(await statusOf(page, number)).toBe("Expired"); // never applied automatically

  const admin = await (await browser.newContext()).newPage();
  await admin.goto(`${BASE}/admin/login`);
  await admin.getByLabel("Password").fill(process.env.TEST_ADMIN_PASSWORD!);
  await admin.getByRole("button", { name: "Sign in" }).click();
  await admin.waitForURL(/\/admin$/);
  await expect(admin.getByText(/Payment received for an order that had expired/)).toBeVisible();
  await expect(admin.getByRole("link", { name: number })).toBeVisible();

  await page.goto(`/account/orders/${number}`);
  await page.getByRole("button", { name: "Order again" }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByRole("link", { name: product.name })).toBeVisible();
});

test("a failed payment can be followed by a successful one", async ({ page }) => {
  const { c, number } = await orderToGateway(page);
  expect((await notify(page, paid(c.id, { status: "failed", event: "order.failed" }))).status()).toBe(200);
  expect(await statusOf(page, number)).toBe("Awaiting payment");
  expect((await notify(page, paid(c.id))).status()).toBe(200);
  expect(await statusOf(page, number)).toBe("Paid");
});

test("foreign checkout host and gateway errors: no redirect, a general message", async ({ page }) => {
  await checkout(page, "Evil");
  await expect(page).toHaveURL(/\/account\/orders\/PP\d+\?pay=unavailable/);
  await expect(page.getByText(/Card payment is temporarily unavailable/)).toBeVisible();
  expect(await page.locator("main").innerText()).not.toMatch(/evil\.example|\b422\b|public_order_id/);

  await checkout(page, "Invalid", false);
  await expect(page).toHaveURL(/\?pay=unavailable/);
  await expect(page.getByText(/Card payment is temporarily unavailable/)).toBeVisible();
});

test("a price changed in the browser is never sent to the gateway", async ({ page }) => {
  await registerAndVerify(page, uniqueEmail("gwtamper"));
  await addToCart(page, product.slug);
  await page.goto("/checkout");
  await page.getByLabel("Full name").fill("Gateway Tester");
  await page.getByLabel("Phone").fill("+44 7700 900123");
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

test("without a webhook secret every notification is refused", async ({ request }) => {
  const r = await request.post("http://localhost:3200/api/payments/notify", {
    data: JSON.stringify({ event: "order.paid", status: "success", public_order_id: "x", amount: "1.00", currency: "GBP", signature: "0".repeat(64) }),
    headers: { "content-type": "application/json" },
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
