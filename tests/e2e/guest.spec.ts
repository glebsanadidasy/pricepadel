import { expect, test, type Page } from "@playwright/test";
import { addToCart, answerCookies, mails, simpleProduct, uniqueEmail } from "./helpers";

/** Guest checkout on the main test server (local payment simulation): no account, every payment field required. */
test.beforeEach(async ({ context }) => answerCookies(context));

const product = simpleProduct();

async function fillGuest(page: Page, f: Partial<Record<"email" | "phone" | "full_name" | "line1" | "city" | "postcode", string>> = {}) {
  const d = { email: uniqueEmail("guest"), phone: "+44 7700 900123", full_name: "Guest Buyer", line1: "1 Test Street", city: "London", postcode: "SW1A 1AA", ...f };
  await page.getByLabel("E-mail").fill(d.email);
  await page.getByLabel("Phone").fill(d.phone);
  await page.getByLabel("Full name").fill(d.full_name);
  await page.getByLabel("Address line 1").fill(d.line1);
  await page.getByLabel("City").fill(d.city);
  await page.getByLabel("Postcode").fill(d.postcode);
  await page.getByLabel(/I have read and accept/).check();
  return d;
}

test("a guest buys without an account; only the private link or the same browser opens the order", async ({ page, browser }) => {
  await addToCart(page, product.slug);
  await page.goto("/checkout");
  await expect(page.getByRole("form", { name: "Guest checkout" })).toBeVisible();

  // Missing payment fields are refused and what was typed is kept.
  await fillGuest(page, { phone: "07700 900123" });
  await page.getByRole("button", { name: "Pay by Wallet" }).click();
  await expect(page.getByText(/phone number with the country code/)).toBeVisible();
  await expect(page.getByLabel("Phone")).toHaveValue("07700 900123");
  await expect(page.getByLabel("Full name")).toHaveValue("Guest Buyer");
  await fillGuest(page, { full_name: "Cher" });
  await page.getByRole("button", { name: "Pay by Wallet" }).click();
  await expect(page.getByText(/first name and surname/)).toBeVisible();
  await expect(page.getByLabel("Full name")).toHaveValue("Cher"); // the answer to this submission has arrived
  await fillGuest(page, { postcode: "JE2 3AB" });
  await page.getByRole("button", { name: "Pay by Wallet" }).click();
  await expect(page.getByText(/Channel Islands, the Isle of Man or BFPO/)).toBeVisible();
  await expect(page.getByLabel("Postcode")).toHaveValue("JE2 3AB");

  const d = await fillGuest(page);
  await page.getByRole("button", { name: "Pay by Wallet" }).click();
  await expect(page.getByText("Test payment page — simulation").first()).toBeVisible();
  const number = (await page.getByText(/Order PP\d+/).textContent())!.match(/PP\d+/)![0];
  await page.getByRole("button", { name: "Pay (success)" }).click();
  await expect(page.getByText(/Payment received for order/)).toBeVisible();

  // The same browser can open the order (cookie).
  await page.goto(`/orders/${number}`);
  await expect(page.getByTestId("order-status")).toHaveText("Paid");

  const linkMail = mails().find((m) => m.to === d.email && m.text.includes(`/orders/${number}?t=`));
  expect(linkMail, "private order link e-mailed to the guest").toBeTruthy();
  expect(mails().some((m) => m.to === d.email && m.subject.includes(number) && m.text.includes("We have received your payment"))).toBe(true);
  const link = linkMail!.text.match(/\/orders\/PP\d+\?t=[\w-]+/)![0];

  // Another browser: nothing without the token, everything with it.
  const other = await (await browser.newContext()).newPage();
  for (const url of [`/orders/${number}`, `/orders/${number}?t=wrong-token`, `/checkout/result?order=${number}`, `/account/orders/${number}`]) {
    const res = await other.goto(url);
    if (url.startsWith("/account")) await expect(other).toHaveURL(/\/account\/login/);
    else expect(res?.status(), url).toBe(404);
  }
  await other.goto(link);
  await expect(other.getByTestId("order-status")).toHaveText("Paid");
});

test("a guest can retry a declined payment from the private order page", async ({ page }) => {
  await addToCart(page, product.slug);
  await page.goto("/checkout");
  await fillGuest(page);
  await page.getByRole("button", { name: "Pay by Wallet" }).click();
  const number = (await page.getByText(/Order PP\d+/).textContent())!.match(/PP\d+/)![0];
  await page.getByRole("button", { name: "Decline card" }).click();
  await expect(page.getByText("Your card was declined.")).toBeVisible();
  await page.goto(`/orders/${number}`);
  await page.getByRole("button", { name: "Pay now" }).click();
  await page.getByRole("button", { name: "Pay (success)" }).click();
  await expect(page.getByText(/Payment received for order/)).toBeVisible();
});
