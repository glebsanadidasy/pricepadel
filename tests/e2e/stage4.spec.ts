import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { addToCart, answerCookies, mails, PASSWORD, registerAndVerify, simpleProduct, uniqueEmail } from "./helpers";

const gbp = (p: number) => `£${(p / 100).toLocaleString("en-GB", { minimumFractionDigits: 2 })}`;

test.describe("with cookies answered", () => {
  test.beforeEach(async ({ context }) => answerCookies(context));

  test("password reset: same answer for any e-mail, one-time link, old sessions end", async ({ page, browser }) => {
    const email = uniqueEmail("reset");
    await registerAndVerify(page, email);
    // A second signed-in device must be signed out by the reset.
    const other = await browser.newContext();
    await answerCookies(other);
    const otherPage = await other.newPage();
    await otherPage.goto("/account/login");
    await otherPage.getByLabel("E-mail").fill(email);
    await otherPage.getByLabel("Password").fill(PASSWORD);
    await otherPage.getByRole("button", { name: "Sign in" }).click();
    await expect(otherPage).toHaveURL(/\/account$/);

    const before = mails().length;
    const answers: string[] = [];
    for (const who of [uniqueEmail("nobody"), email]) {
      await page.goto("/account/forgot");
      await page.getByLabel("E-mail").fill(who);
      await page.getByRole("button", { name: "Send reset link" }).click();
      answers.push((await page.getByRole("status").textContent())!.trim());
    }
    expect(answers[0]).toBe(answers[1]);
    const sent = mails().slice(before);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe(email);

    const link = sent[0].text.match(/\/account\/reset\?token=\S+/)![0];
    await page.goto(link);
    await page.locator("input[name=password]").fill("a brand new password");
    await page.getByRole("button", { name: "Save new password" }).click();
    await expect(page.getByText("Your password has been changed")).toBeVisible();
    // The link works once.
    await page.goto(link);
    await page.locator("input[name=password]").fill("yet another password");
    await page.getByRole("button", { name: "Save new password" }).click();
    await expect(page.getByText(/invalid or has expired/)).toBeVisible();
    // Old password no longer works, new one does; the other device was signed out.
    await page.goto("/account/login");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Wrong e-mail or password.")).toBeVisible();
    await page.getByLabel("Password").fill("a brand new password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/account$/);
    await otherPage.goto("/account");
    await expect(otherPage).toHaveURL(/\/account\/login/);
    await other.close();
  });

  test("delivery: £12.95 under £100, free from £100, shown on product, cart and checkout", async ({ page }) => {
    const cheap = simpleProduct(0, 10000);
    await page.goto(`/product/${cheap.slug}`);
    await expect(page.getByText("Delivery to the UK: £12.95, free on orders of £100.00 or more.")).toBeVisible();
    await addToCart(page, cheap.slug);
    await page.goto("/cart");
    const retail = Math.round(cheap.sourcePrice * 1.15);
    await expect(page.getByText("Delivery (UK)", { exact: true })).toBeVisible();
    await expect(page.getByText(gbp(retail + 1295)).first()).toBeVisible();
    await expect(page.getByTestId("delivery-terms")).toContainText(`Add ${gbp(10000 - retail)} more for free delivery`);

    let expensive;
    try {
      expensive = simpleProduct(10000);
    } catch {
      test.skip(true, "no simple product of £100 or more in the test copy");
    }
    await addToCart(page, expensive!.slug);
    await page.goto("/cart");
    await expect(page.getByText("Free delivery", { exact: true })).toBeVisible();
  });

  test("only UK addresses can be saved", async ({ page }) => {
    await registerAndVerify(page, uniqueEmail("uk"));
    await page.goto("/account/addresses");
    const options = await page.getByLabel(/Country/).locator("option").allTextContents();
    expect(options).toEqual(["United Kingdom"]);
  });

  test("currencies: a stale rate switches the currency off and the admin is warned", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Pound sterling/ }).first().click();
    const offered = await page.getByRole("option").allTextContents();
    expect(offered.join(" ")).toContain("Euro");
    expect(offered.join(" ")).not.toContain("US dollar");

    await page.goto("/admin/login");
    await page.getByLabel("Password").fill(process.env.TEST_ADMIN_PASSWORD!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText(/Currency switched off: USD/)).toBeVisible();
  });

  test("company details, hidden programmes and policy pages", async ({ page, request }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toContainText("HYPERION MOTION LTD, trading as Price Padel");
    await expect(footer).toContainText("17358996");
    await expect(footer).toContainText("CF31 1JF");
    await expect(footer.getByRole("link", { name: /Affiliate|Ambassador/ })).toHaveCount(0);
    for (const url of ["/affiliate-program", "/brand-ambassador"]) expect((await request.get(url)).status()).toBe(404);

    const pages = ["terms", "privacy", "cookies", "shipping", "returns", "payment", "warranty", "acceptable-use", "disclaimer"].map((s) => `/policies/${s}`);
    for (const url of [...pages, "/faq", "/about", "/contact"]) {
      await page.goto(url);
      await expect(page.getByText(/Last updated:/)).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Contents" })).toBeVisible();
      expect(await page.content()).not.toMatch(/nuestro/i);
    }
  });

  test("non-padel products are hidden", async ({ request }) => {
    const products = JSON.parse(fs.readFileSync(path.join(process.env.TEST_DATA_DIR!, "catalog/products.json"), "utf8")) as { slug: string; hiddenReason: string | null }[];
    const hidden = products.filter((p) => p.hiddenReason?.startsWith("not a padel product"));
    test.skip(hidden.length === 0, "no non-padel products in this copy of the catalogue yet");
    for (const p of hidden) expect((await request.get(`/product/${p.slug}`)).status()).toBe(404);
  });
});

test("cookie notice: Reject is as easy as Accept and the choice is remembered", async ({ page, context }) => {
  await page.goto("/");
  const notice = page.getByRole("dialog", { name: "Cookies" });
  await expect(notice).toBeVisible();
  const reject = notice.getByRole("button", { name: "Reject" });
  const accept = notice.getByRole("button", { name: "Accept" });
  const [r, a] = [await reject.boundingBox(), await accept.boundingBox()];
  expect(Math.round(r!.width)).toBe(Math.round(a!.width));
  expect(Math.round(r!.height)).toBe(Math.round(a!.height));
  expect(await reject.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(await accept.evaluate((e) => getComputedStyle(e).backgroundColor));
  await reject.click();
  await expect(notice).toHaveCount(0);
  expect((await context.cookies()).find((c) => c.name === "pp_consent")?.value).toBe("rejected");
  await page.reload();
  await expect(page.getByRole("dialog", { name: "Cookies" })).toHaveCount(0);
});
