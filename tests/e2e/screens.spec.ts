import { test } from "@playwright/test";
import { addToCart, checkoutToGateway, registerAndVerify, simpleProduct, uniqueEmail } from "./helpers";

/** Screenshots of the shopping flow for a visual check (desktop + phone). Run with SCREENS=1. */
test.skip(!process.env.SCREENS, "screenshots only on request");

for (const [label, viewport] of [
  ["desktop", { width: 1366, height: 900 }],
  ["mobile", { width: 390, height: 844 }],
] as const) {
  test(`flow screenshots ${label}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const shot = (name: string) => page.screenshot({ path: `test-results/screens/${label}-${name}.png`, fullPage: true });
    const product = simpleProduct();
    await page.goto(`/product/${product.slug}`);
    await shot("product");
    await registerAndVerify(page, uniqueEmail(`shot-${label}`));
    await shot("account");
    await addToCart(page, product.slug);
    await page.goto("/cart");
    await shot("cart");
    await page.goto("/checkout");
    await shot("checkout-empty");
    const number = await checkoutToGateway(page);
    await shot("gateway");
    await page.getByRole("button", { name: "Decline card" }).click();
    await shot("result-declined");
    await page.getByRole("button", { name: "Try paying again" }).click();
    await page.getByRole("button", { name: "Pay (success)" }).click();
    await shot("result-paid");
    await page.goto(`/account/orders/${number}`);
    await shot("order");
    await page.goto("/admin/login");
    await page.getByLabel("Password").fill(process.env.TEST_ADMIN_PASSWORD!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/admin$/);
    await shot("admin-overview");
    await page.goto(`/admin/orders/${number}`);
    await shot("admin-order");
    await page.goto(`/admin/products/${product.id}`);
    await shot("admin-product");
    await page.goto("/admin/settings");
    await shot("admin-settings");
  });
}
