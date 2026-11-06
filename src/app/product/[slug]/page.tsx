import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/PageHero";
import { ProductCard, toCard } from "@/components/shop/ProductCard";
import { VariantPicker } from "@/components/shop/VariantPicker";
import { currentUser } from "@/lib/auth";
import { getProduct, relatedProducts } from "@/lib/catalog";
import { readSettings } from "@/lib/catalog-store";
import { getMoney } from "@/lib/currency";
import { db } from "@/lib/db";
import { AUDIENCE_LABELS, CATEGORY_LABELS } from "@/lib/catalog-types";

type Props = { params: Promise<{ slug: string }> };

/** Delivery terms (no delivery-time promises). Delivery is always its own line before payment. */
function DeliveryNote({ price, freeFrom }: { price: string; freeFrom: string }) {
  return (
    <p className="mt-[10px] text-[14px] leading-[21px] text-body">
      <span className="font-bold text-ink">
        Delivery to the UK: {price}, free on orders of {freeFrom} or more.
      </span>{" "}
      Shown as a separate line before payment.
    </p>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getProduct((await params).slug);
  return p ? { title: p.name, description: `${p.name} — ${CATEGORY_LABELS[p.category]} by ${p.brand}.` } : {};
}

export default async function ProductPage({ params }: Props) {
  const product = getProduct((await params).slug);
  if (!product) notFound();
  const money = await getMoney();
  const related = relatedProducts(product);
  const variants = product.variants.map((v) => ({ ...v, priceLabel: money.format(v.price) }));
  const samePrice = product.variants.every((v) => v.price === product.price);
  const delivery = readSettings().delivery.customer;
  const user = await currentUser();
  const saved = !!user && !!db().prepare("SELECT 1 FROM wishlist WHERE user_id = ? AND product_id = ?").get(user.id, product.id);
  const details = [
    { label: "Brand", value: product.brand },
    { label: "Category", value: CATEGORY_LABELS[product.category] },
    { label: "For", value: AUDIENCE_LABELS[product.audience] },
    ...(product.mpn ? [{ label: "Manufacturer code", value: product.mpn }] : []),
    ...(product.specs ?? []),
  ];

  return (
    <>
      <PageHero
        title={CATEGORY_LABELS[product.category]}
        crumbs={[
          { href: "/shop", label: "Shop" },
          { href: `/shop?category=${product.category}`, label: CATEGORY_LABELS[product.category] },
        ]}
      />
      <div className="mx-auto max-w-site px-[15px] pb-[80px] pt-[44px] lg:px-0">
        {product.isTest && (
          <p className="mb-[24px] border-l-4 border-lime bg-[#f7fbe5] px-[16px] py-[10px] text-[14px] text-body">
            Preview sample from the design mockup. Sizes and colours are placeholders to show how choosing works.
          </p>
        )}
        <VariantPicker
          id={product.id}
          slug={product.slug}
          saved={saved}
          name={product.name}
          images={product.images}
          colours={product.colours}
          sizes={product.sizes}
          variants={variants}
          priceLabel={`${samePrice ? "" : "From "}${money.format(product.price)}`}
        >
          <DeliveryNote price={money.format(delivery.price)} freeFrom={money.format(delivery.freeFrom)} />
        </VariantPicker>
        <div className="mt-[50px] grid gap-[40px] border-t border-line pt-[30px] lg:grid-cols-[minmax(0,560px)_1fr] lg:gap-[70px]">
          <section aria-labelledby="specs-title">
            <h2 id="specs-title" className="text-[14px] font-bold uppercase tracking-[1px] text-ink">
              Specifications
            </h2>
            <dl className="mt-[14px] grid grid-cols-[minmax(110px,40%)_1fr] gap-x-[16px] gap-y-[10px] text-[15px] leading-[21px]">
              {details.map((d) => (
                <div key={d.label} className="contents">
                  <dt className="text-[#888]">{d.label}</dt>
                  <dd className="text-ink">{d.value}</dd>
                </div>
              ))}
            </dl>
          </section>
          {product.description && product.description.length > 0 && (
            <section aria-labelledby="description-title" className="text-[15px] leading-[25px] text-body">
              <h2 id="description-title" className="text-[14px] font-bold uppercase tracking-[1px] text-ink">
                Description
              </h2>
              <div className="mt-[14px] space-y-[12px]">
                {product.description.map((b, i) =>
                  b.type === "list" ? (
                    <ul key={i} className="list-disc space-y-[4px] pl-[20px]">
                      {b.items.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  ) : b.type === "heading" ? (
                    <h3 key={i} className="pt-[6px] text-[16px] font-bold text-ink">
                      {b.text}
                    </h3>
                  ) : (
                    <p key={i}>{b.text}</p>
                  ),
                )}
              </div>
            </section>
          )}
        </div>
        {related.length > 0 && (
          <section aria-labelledby="related-title" className="mt-[80px]">
            <h2 id="related-title" className="text-center text-[28px] font-black uppercase text-ink lg:text-[34px]">
              You may also like
            </h2>
            <ul className="mt-[40px] grid grid-cols-2 gap-x-[20px] gap-y-[40px] lg:grid-cols-4 lg:gap-x-[34px]">
              {related.map((p) => (
                <li key={p.slug}>
                  <ProductCard product={toCard(p, money.format(p.price))} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
