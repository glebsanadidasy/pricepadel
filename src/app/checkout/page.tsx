import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AddressForm } from "@/components/account/AccountForms";
import { PageHero } from "@/components/layout/PageHero";
import { Notice, SubmitButton } from "@/components/ui/Form";
import { countryName } from "@/config/countries";
import { resendVerification } from "@/app/account/actions";
import { userAddresses } from "@/lib/addresses";
import { requireUser } from "@/lib/auth";
import { readCart, resolveCart } from "@/lib/cart";
import { getMoney } from "@/lib/currency";
import { placeOrder } from "./actions";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

const ERRORS: Record<string, string> = {
  terms: "Please accept the Terms & Conditions to continue.",
  address: "Please choose a delivery address.",
  changed: "Prices or stock changed while you were checking out. Please review the updated summary.",
  verify: "Please confirm your e-mail before placing an order.",
};

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const user = await requireUser("/checkout");
  const cart = resolveCart(await readCart());
  if (cart.lines.length === 0 || !cart.ok) redirect("/cart");
  const money = await getMoney();
  const addresses = userAddresses(user.id);
  const error = ERRORS[(await searchParams).e ?? ""];

  return (
    <>
      <PageHero title="Checkout" crumbs={[{ href: "/cart", label: "Cart" }]} />
      <div className="mx-auto max-w-site px-[15px] pb-[80px] pt-[36px] lg:px-0">
        {error && (
          <div className="mb-[20px]">
            <Notice kind="error">{error}</Notice>
          </div>
        )}
        {!user.email_verified_at ? (
          <div className="max-w-[560px] space-y-[14px]">
            <Notice>Please confirm your e-mail ({user.email}) to place an order. Open the link we sent you, then come back to this page.</Notice>
            <form action={resendVerification}>
              <SubmitButton variant="plain">Send the link again</SubmitButton>
            </form>
          </div>
        ) : (
          <div className="grid gap-[40px] lg:grid-cols-[1fr_380px]">
            <div className="space-y-[30px]">
              <section>
                <h2 className="text-[18px] font-bold text-ink">Delivery address</h2>
                {addresses.length === 0 && <p className="mt-[6px] text-[15px]">Add an address to continue.</p>}
                <div className="mt-[14px]">
                  <h3 className="text-[15px] font-bold text-ink">{addresses.length ? "Or add a new address" : "New address"}</h3>
                  <div className="mt-[10px]">
                    <AddressForm back="/checkout" />
                  </div>
                </div>
              </section>
            </div>
            <form action={placeOrder} className="self-start border border-line p-[22px] lg:order-none" aria-labelledby="summary-title">
              <h2 id="summary-title" className="text-[16px] font-bold uppercase tracking-[1px] text-ink">
                Your order
              </h2>
              {addresses.length > 0 && (
                <fieldset className="mt-[14px] space-y-[8px] text-[14px]">
                  <legend className="font-bold text-ink">Deliver to</legend>
                  {addresses.map((a, i) => (
                    <label key={a.id} className="flex items-start gap-[8px]">
                      <input type="radio" name="address" value={a.id} defaultChecked={i === addresses.length - 1} required className="mt-[4px] accent-royal" />
                      <span>
                        {a.full_name}, {a.line1}, {a.postcode} {a.city}, {countryName(a.country)}
                      </span>
                    </label>
                  ))}
                </fieldset>
              )}
              <ul className="mt-[16px] space-y-[8px] border-t border-line pt-[12px] text-[14px]">
                {cart.lines.map((l) => (
                  <li key={l.sku} className="flex justify-between gap-[10px]">
                    <span>
                      {l.qty} × {l.product!.name}
                      <span className="block text-[#888]">{[l.variant!.colour, l.variant!.size].filter(Boolean).join(" · ")}</span>
                    </span>
                    <span className="whitespace-nowrap text-ink">{money.format(l.lineTotal)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-[14px] space-y-[6px] border-t border-line pt-[12px] text-[15px]">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd className="text-ink">{money.format(cart.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>{cart.delivery === 0 ? "Free delivery" : "Delivery"}</dt>
                  <dd className="text-ink">{money.format(cart.delivery)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Other fees</dt>
                  <dd className="text-ink">{money.format(0)}</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-[10px] text-[18px] font-bold text-ink">
                  <dt>Total to pay</dt>
                  <dd data-testid="checkout-total">{money.format(cart.total)}</dd>
                </div>
              </dl>
              <p className="mt-[6px] text-[13px] text-[#888]">Prices include VAT. Charged in {money.currency}.</p>
              <input type="hidden" name="expected" value={`${money.currency}:${money.format(cart.total)}`} />
              <label className="mt-[16px] flex items-start gap-[10px] text-[14px] leading-[20px]">
                <input type="checkbox" name="terms" value="yes" required className="mt-[3px] size-[16px] accent-royal" />
                <span>
                  I have read and accept the{" "}
                  <Link href="/policies/terms" target="_blank" className="text-royal underline">
                    Terms &amp; Conditions
                  </Link>
                  .
                </span>
              </label>
              <SubmitButton className="mt-[16px] w-full" disabled={addresses.length === 0}>
                Pay by card
              </SubmitButton>
              <p className="mt-[10px] text-[13px] leading-[19px] text-body">You’ll pay by Visa or Mastercard on the payment provider’s secure page. We never see your card details.</p>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
