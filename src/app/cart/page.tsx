import type { Metadata } from "next";
import { StubPage } from "@/components/layout/StubPage";
import { formatPrice } from "@/config/currency";
import { readSettings } from "@/lib/catalog-store";
import { getCurrency } from "@/lib/currency";

export const metadata: Metadata = { title: "Cart" };

export default async function Page() {
  const currency = await getCurrency();
  const tiers = readSettings().delivery.tiers;
  const money = (p: number) => formatPrice(p, currency);
  return (
    <StubPage title="Cart" crumbs={[{ href: "/cart", label: "Cart" }]}>
      <p>Your cart is empty. You’ll need an account to place an order.</p>
      <h2 className="mt-[24px] font-bold text-ink">Delivery to the UK and Europe</h2>
      <p>Delivery is added as a separate line in your order summary, before payment:</p>
      <ul className="mt-[6px] list-disc pl-[20px]">
        {tiers.map((t, i) => {
          const from = i === 0 ? 0 : tiers[i - 1].below!;
          const band = t.below === null ? `Orders of ${money(from)} and over` : i === 0 ? `Orders under ${money(t.below)}` : `Orders from ${money(from)} to ${money(t.below - 1)}`;
          return (
            <li key={i}>
              {band}: {t.price === 0 ? "free" : money(t.price)}
            </li>
          );
        })}
      </ul>
    </StubPage>
  );
}
