import { expect, test } from "@playwright/test";
import { addToCart, answerCookies, checkoutToGateway, mails, registerAndVerify, simpleProduct, uniqueEmail } from "./helpers";

test.beforeEach(async ({ context }) => answerCookies(context));

test("addresses in the Channel Islands, Isle of Man, BFPO and PO boxes are refused", async ({ page }) => {
  await registerAndVerify(page, uniqueEmail("blocked"));
  const cases = [
    { line1: "1 Rue de la Gare", postcode: "JE2 3AB", message: /Channel Islands, the Isle of Man or BFPO/ },
    { line1: "2 Harbour Road", postcode: "IM1 1AA", message: /Channel Islands, the Isle of Man or BFPO/ },
    { line1: "Unit 5", postcode: "BFPO 105", message: /Channel Islands, the Isle of Man or BFPO/ },
    { line1: "PO Box 123", postcode: "SW1A 1AA", message: /PO boxes/ },
  ];
  for (const c of cases) {
    await page.goto("/account/addresses");
    await page.getByLabel("Full name").fill("Test Customer");
    await page.getByLabel("Phone").fill("+44 7700 900123");
    await page.getByLabel("Address line 1").fill(c.line1);
    await page.getByLabel("City").fill("Town");
    await page.getByLabel("Postcode").fill(c.postcode);
    await page.getByRole("button", { name: "Save address" }).click();
    await expect(page.getByText(c.message)).toBeVisible();
  }
  // The payment provider needs a surname and a phone number with the country code.
  for (const [name, phone] of [
    ["Cher", "+44 7700 900123"],
    ["Test Customer", "07700 900123"],
  ]) {
    await page.goto("/account/addresses");
    await page.getByLabel("Full name").fill(name);
    await page.getByLabel("Phone").fill(phone);
    await page.getByLabel("Address line 1").fill("1 High Street");
    await page.getByLabel("City").fill("Town");
    await page.getByLabel("Postcode").fill("SW1A 1AA");
    await page.getByRole("button", { name: "Save address" }).click();
    await expect(page.getByText(/first name and surname, and a phone number with the country code/)).toBeVisible();
  }
  // Northern Ireland and the Scottish islands are fine.
  for (const postcode of ["BT1 1AA", "HS1 2AB"]) {
    await page.goto("/account/addresses");
    await page.getByLabel("Full name").fill("Test Customer");
    await page.getByLabel("Phone").fill("+44 7700 900123");
    await page.getByLabel("Address line 1").fill("1 High Street");
    await page.getByLabel("City").fill("Town");
    await page.getByLabel("Postcode").fill(postcode);
    await page.getByRole("button", { name: "Save address" }).click();
    await expect(page.getByText("Address saved.")).toBeVisible();
  }
});

test("data protection complaint form: no account, spam is ignored, admin sees it", async ({ page }) => {
  const email = uniqueEmail("dpc");
  // A bot that submits instantly is answered politely but nothing is stored or sent.
  await page.goto("/contact");
  await page.getByLabel("Your name").fill("Bot");
  await page.getByLabel("E-mail").fill(`bot-${email}`);
  await page.getByLabel(/Your complaint/).fill("Buy cheap things now at my site");
  await page.getByRole("button", { name: "Send complaint" }).click();
  await expect(page.getByText(/We have received your complaint/)).toBeVisible();
  expect(mails().some((m) => m.to === `bot-${email}`)).toBe(false);

  // A person who takes a few seconds.
  await page.goto("/contact");
  await page.getByLabel("Your name").fill("Jane Tester");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel(/Your complaint/).fill("Please tell me what data you hold about me.");
  await page.waitForTimeout(3200);
  await page.getByRole("button", { name: "Send complaint" }).click();
  await expect(page.getByText(/We have received your complaint/)).toBeVisible();
  expect(mails().some((m) => m.to === email && /data protection complaint DC\d+/.test(m.subject))).toBe(true);
  expect(mails().some((m) => m.to === "contact@pricepadel.com" && m.text.includes(email))).toBe(true);

  await page.goto("/admin/login");
  await page.getByLabel("Password").fill(process.env.TEST_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/admin$/);
  await page.goto("/admin/complaints");
  await expect(page.getByText("Please tell me what data you hold about me.")).toBeVisible();
});

test("the Shipped e-mail carries the tracking number", async ({ page, browser }) => {
  const email = uniqueEmail("track");
  const product = simpleProduct();
  await registerAndVerify(page, email);
  await addToCart(page, product.slug);
  const number = await checkoutToGateway(page);
  await page.getByRole("button", { name: "Pay (success)" }).click();
  await expect(page.getByText(/Payment received for order/)).toBeVisible();

  const admin = await (await browser.newContext()).newPage();
  await admin.goto("/admin/login");
  await admin.getByLabel("Password").fill(process.env.TEST_ADMIN_PASSWORD!);
  await admin.getByRole("button", { name: "Sign in" }).click();
  await admin.waitForURL(/\/admin$/);
  for (const status of ["Ordered", "Shipped"]) {
    await admin.goto(`/admin/orders/${number}`);
    await admin.locator("select[name=status]").selectOption(status);
    if (status === "Shipped") await admin.getByPlaceholder(/Tracking number/).fill("TRK123456789GB");
    await admin.getByRole("button", { name: "Update status" }).click();
    await expect(admin.getByText(new RegExp(`— ${status} \\(admin\\)`))).toBeVisible();
  }
  const shipped = mails().find((m) => m.to === email && m.subject.includes("dispatched"));
  expect(shipped?.text).toContain("Tracking number: TRK123456789GB");
  expect(mails().some((m) => m.to === email && m.subject.includes("accepted"))).toBe(true);
  await page.goto(`/account/orders/${number}`);
  await expect(page.getByText("TRK123456789GB")).toBeVisible();
});
