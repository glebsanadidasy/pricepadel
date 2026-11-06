import { expect, test } from "@playwright/test";
import { addToCart, answerCookies, checkoutToGateway, deliveryFor, mails, orderStatus, paymentIdFromUrl, registerAndVerify, signedNotification, simpleProduct, uniqueEmail, PASSWORD } from "./helpers";

const product = simpleProduct();
const retail = Math.round(product.sourcePrice * 1.15);
const delivery = deliveryFor(retail);
const total = retail + delivery;

test.beforeEach(async ({ context }) => answerCookies(context));
const gbp = (p: number) => `£${(p / 100).toLocaleString("en-GB", { minimumFractionDigits: 2 })}`;

test("registration needs a confirmed e-mail before checkout", async ({ page }) => {
  const email = uniqueEmail("reg");
  await page.goto("/account/register");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/account\?welcome=1/);
  // Not confirmed yet: checkout refuses.
  await addToCart(page, product.slug);
  await page.goto("/checkout");
  await expect(page.getByText(/Please confirm your e-mail/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Pay by card" })).toHaveCount(0);
  // Confirm through the e-mail link.
  const mail = mails().reverse().find((m) => m.to === email)!;
  await page.goto(mail.text.match(/\/account\/verify\?token=\S+/)![0]);
  await expect(page.getByText("your e-mail is confirmed")).toBeVisible();
  await page.goto("/account");
  await expect(page.getByText("Confirmed", { exact: true })).toBeVisible();
  // Sign out and back in.
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.goto("/account/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Password").fill("wrong password!!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Wrong e-mail or password.")).toBeVisible();
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/account$/);
});

test("catalogue and cart work without an account; prices come from the server", async ({ page }) => {
  await page.goto(`/product/${product.slug}`);
  await expect(page.getByText(gbp(retail)).first()).toBeVisible();
  await addToCart(page, product.slug);
  await page.goto("/cart");
  await expect(page.getByText(delivery === 0 ? "Free delivery" : "Delivery (UK)", { exact: true })).toBeVisible();
  await expect(page.getByText(gbp(retail)).first()).toBeVisible();
  // A forged cart cookie with an unknown SKU is refused by the server.
  await page.context().addCookies([{ name: "pp_cart", value: JSON.stringify([{ sku: "PP-FAKE-1", qty: 1 }]), url: page.url() }]);
  await page.goto("/cart");
  await expect(page.getByText(/No longer available/)).toBeVisible();
  await page.goto("/checkout");
  await expect(page).not.toHaveURL(/\/checkout$/);
});

test("successful payment: order is Paid only after the notification, e-mails go out", async ({ page }) => {
  const email = uniqueEmail("paid");
  await registerAndVerify(page, email);
  await addToCart(page, product.slug);
  await page.goto("/checkout");
  await expect(page.getByTestId("checkout-total")).toHaveText(gbp(total));
  await expect(page.getByTestId("delivery-terms")).toContainText("free on orders of £100.00 or more");
  const number = await checkoutToGateway(page);
  expect(await orderStatus(page, number)).toBe("Awaiting payment");
  await page.goBack();
  await page.getByRole("button", { name: "Pay (success)" }).click();
  await expect(page.getByText(/Payment received for order/)).toBeVisible();
  expect(await orderStatus(page, number)).toBe("Paid");
  const sent = mails();
  expect(sent.some((m) => m.to === "contact@pricepadel.com" && m.subject.includes(number) && m.text.includes(product.name))).toBe(true);
  expect(sent.some((m) => m.to === email && m.subject.includes(number))).toBe(true);
});

test("declined and cancelled payments leave the order unpaid, and paying again works", async ({ page }) => {
  await registerAndVerify(page, uniqueEmail("decline"));
  await addToCart(page, product.slug);
  const number = await checkoutToGateway(page);
  await page.getByRole("button", { name: "Decline card" }).click();
  await expect(page.getByText("Your card was declined.")).toBeVisible();
  expect(await orderStatus(page, number)).toBe("Awaiting payment");

  await page.getByRole("button", { name: "Pay now" }).click();
  await expect(page.getByText("Test payment page")).toBeVisible();
  await page.getByRole("button", { name: "Cancel and return" }).click();
  await expect(page.getByText("The payment was cancelled.")).toBeVisible();
  expect(await orderStatus(page, number)).toBe("Awaiting payment");
  expect(mails().some((m) => m.subject.includes(number))).toBe(false);

  await page.getByRole("button", { name: "Pay now" }).click();
  await page.getByRole("button", { name: "Pay (success)" }).click();
  await expect(page.getByText(/Payment received for order/)).toBeVisible();
  expect(await orderStatus(page, number)).toBe("Paid");
});

test("forged and wrong-amount notifications are rejected", async ({ page, request }) => {
  await registerAndVerify(page, uniqueEmail("forge"));
  await addToCart(page, product.slug);
  const number = await checkoutToGateway(page);
  const paymentId = paymentIdFromUrl(page.url());
  const body = { type: "payment.succeeded", payment_id: paymentId, order_number: number, amount: total, currency: "GBP" };

  // Signed with the wrong secret.
  const forged = signedNotification(body, "f".repeat(64));
  let r = await request.post("/api/payments/webhook", { data: forged.raw, headers: { "content-type": "application/json", "x-pp-signature": forged.signature } });
  expect(r.status()).toBe(401);
  // No signature at all.
  r = await request.post("/api/payments/webhook", { data: JSON.stringify(body), headers: { "content-type": "application/json" } });
  expect(r.status()).toBe(401);
  // Correct signature, wrong amount.
  const cheap = signedNotification({ ...body, amount: total - 100 });
  r = await request.post("/api/payments/webhook", { data: cheap.raw, headers: { "content-type": "application/json", "x-pp-signature": cheap.signature } });
  expect(r.status()).toBe(400);
  // Correct signature, wrong currency.
  const usd = signedNotification({ ...body, currency: "USD" });
  r = await request.post("/api/payments/webhook", { data: usd.raw, headers: { "content-type": "application/json", "x-pp-signature": usd.signature } });
  expect(r.status()).toBe(400);
  expect(await orderStatus(page, number)).toBe("Awaiting payment");

  // The genuine notification is accepted.
  const good = signedNotification(body);
  r = await request.post("/api/payments/webhook", { data: good.raw, headers: { "content-type": "application/json", "x-pp-signature": good.signature } });
  expect(r.status()).toBe(200);
  expect(await orderStatus(page, number)).toBe("Paid");
});

test("a customer cannot see someone else's order", async ({ page, browser }) => {
  await registerAndVerify(page, uniqueEmail("owner"));
  await addToCart(page, product.slug);
  const number = await checkoutToGateway(page);

  const other = await browser.newContext();
  const intruder = await other.newPage();
  await registerAndVerify(intruder, uniqueEmail("intruder"));
  for (const url of [`/account/orders/${number}`, `/checkout/result?order=${number}`]) {
    const res = await intruder.goto(url);
    expect(res?.status(), url).toBe(404);
  }
  await intruder.goto("/account/orders");
  await expect(intruder.getByText(number)).toHaveCount(0);
  // Guests are sent to sign in.
  const guest = await (await browser.newContext()).newPage();
  await guest.goto(`/account/orders/${number}`);
  await expect(guest).toHaveURL(/\/account\/login/);
  await other.close();
});

test("admin panel needs the admin password", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.goto("/admin/orders");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Wrong password.")).toBeVisible();
  // A customer session is not an admin session.
  await registerAndVerify(page, uniqueEmail("notadmin"));
  await page.goto("/admin/products");
  await expect(page).toHaveURL(/\/admin\/login/);

  await page.getByLabel("Password").fill(process.env.TEST_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/orders");
  await expect(page.getByRole("heading", { level: 1 }).or(page.getByText("Admin").first())).toBeVisible();
  await page.goto(`/admin/products?q=${encodeURIComponent(product.name.slice(0, 12))}`);
  await expect(page.getByRole("link", { name: product.name }).first()).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("product page fits the screen and the cart works", async ({ page }) => {
    await page.goto(`/product/${product.slug}`);
    const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(widths.scroll).toBeLessThanOrEqual(widths.client);
    await page.getByRole("button", { name: "Add to cart" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Added to your cart." })).toBeVisible();
    await page.goto("/cart");
    await expect(page.getByRole("link", { name: product.name })).toBeVisible();
    for (const url of ["/", "/shop", "/cart", "/account/login"]) {
      await page.goto(url);
      const w = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(w, `${url} has no horizontal scroll`).toBeLessThanOrEqual(0);
    }
  });
});
