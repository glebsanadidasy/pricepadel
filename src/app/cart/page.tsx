import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { NoPhoto } from "@/components/shop/ProductCard";
import { LimeButton } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/Form";
import { MAX_QTY, readCart, resolveCart } from "@/lib/cart";
import { getMoney } from "@/lib/currency";
import { removeFromCart, setCartQty } from "./actions";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage() {
  const cart = resolveCart(await readCart());
  const money = await getMoney();

  return (
    <>
      <PageHero title="Cart" crumbs={[{ href: "/cart", label: "Cart" }]} />
      <div className="mx-auto max-w-site px-[15px] pb-[80px] pt-[40px] lg:px-0">
        {cart.lines.length === 0 ? (
          <div>
            <p className="text-[18px] text-ink">Your cart is empty.</p>
            <LimeButton href="/shop" className="mt-[24px]">
              Go to the shop
            </LimeButton>
          </div>
        ) : (
          <div className="grid gap-[40px] lg:grid-cols-[1fr_360px]">
            <ul className="divide-y divide-line border-y border-line" aria-label="Cart items">
              {cart.lines.map((l) => {
                const img = l.product?.images.find((i) => i.colour === l.variant?.colour) ?? l.product?.images[0];
                return (
                  <li key={l.sku} className="flex gap-[16px] py-[18px]">
                    <div className="relative size-[88px] shrink-0">
                      {img ? <Image src={img.src} alt="" fill sizes="88px" className="object-contain" /> : <NoPhoto className="absolute inset-0" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      {l.product ? (
                        <Link href={`/product/${l.product.slug}`} className="text-[16px] leading-[22px] text-ink hover:text-royal">
                          {l.product.name}
                        </Link>
                      ) : (
                        <span className="text-[16px] text-ink">Item {l.sku}</span>
                      )}
                      <p className="mt-[4px] text-[14px] text-[#888]">{[l.variant?.colour, l.variant?.size].filter(Boolean).join(" · ")}</p>
                      {l.problem && <p className="mt-[4px] text-[14px] font-bold text-[#c0392b]">{l.problem} — please remove it to continue.</p>}
                      <div className="mt-[10px] flex flex-wrap items-center gap-[10px]">
                        {!l.problem && (
                          <form action={setCartQty.bind(null, l.sku)} className="flex items-center gap-[8px]">
                            <label className="text-[14px] text-ink">
                              Qty{" "}
                              <select name="qty" defaultValue={l.qty} className="h-[36px] border border-line px-[6px]" aria-label={`Quantity of ${l.product?.name ?? l.sku}`}>
                                {Array.from({ length: MAX_QTY }, (_, i) => i + 1).map((n) => (
                                  <option key={n}>{n}</option>
                                ))}
                              </select>
                            </label>
                            <SubmitButton variant="plain" className="h-[36px]">
                              Update
                            </SubmitButton>
                          </form>
                        )}
                        <form action={removeFromCart.bind(null, l.sku)}>
                          <SubmitButton variant="plain" className="h-[36px]">
                            Remove
                          </SubmitButton>
                        </form>
                      </div>
                    </div>
                    <p className="whitespace-nowrap text-[16px] font-bold text-ink">{l.problem ? "—" : money.format(l.lineTotal)}</p>
                  </li>
                );
              })}
            </ul>
            <aside className="self-start border border-line p-[22px]" aria-labelledby="summary-title">
              <h2 id="summary-title" className="text-[16px] font-bold uppercase tracking-[1px] text-ink">
                Order summary
              </h2>
              <dl className="mt-[14px] space-y-[8px] text-[15px]">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd className="text-ink">{money.format(cart.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>{cart.delivery === 0 ? "Free delivery" : "Delivery (UK)"}</dt>
                  <dd className="text-ink">{money.format(cart.delivery)}</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-[10px] text-[17px] font-bold text-ink">
                  <dt>Total</dt>
                  <dd>{money.format(cart.total)}</dd>
                </div>
              </dl>
              <p className="mt-[8px] text-[13px] leading-[19px] text-[#888]" data-testid="delivery-terms">
                Delivery to the UK: {money.format(cart.deliveryPrice)}, free on orders of {money.format(cart.freeFrom)} or more.
                {cart.delivery > 0 && ` Add ${money.format(cart.freeFrom - cart.subtotal)} more for free delivery.`}
              </p>
              <p className="mt-[6px] text-[13px] leading-[19px] text-[#888]">Prices and stock are checked again at checkout.</p>
              {cart.ok ? (
                <LimeButton href="/checkout" className="mt-[18px] w-full">
                  Checkout
                </LimeButton>
              ) : (
                <p className="mt-[18px] text-[14px] font-bold text-[#c0392b]">Remove unavailable items to continue.</p>
              )}
              <p className="mt-[12px] text-[13px] leading-[19px] text-body">Check out as a guest, or sign in to your account.</p>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
