import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/PageHero";
import { ProductCard, toCard } from "@/components/shop/ProductCard";
import { VariantPicker } from "@/components/shop/VariantPicker";
import { formatPrice } from "@/config/currency";
import { getProduct, relatedProducts } from "@/lib/catalog";
import { AUDIENCE_LABELS, CATEGORY_LABELS } from "@/lib/catalog-types";
import { getCurrency } from "@/lib/currency";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getProduct((await params).slug);
  return p ? { title: p.name, description: `${p.name} — ${CATEGORY_LABELS[p.category]} by ${p.brand}.` } : {};
}

export default async function ProductPage({ params }: Props) {
  const product = getProduct((await params).slug);
  if (!product) notFound();
  const currency = await getCurrency();
  const related = relatedProducts(product);

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
        <VariantPicker name={product.name} images={product.images} colours={product.colours} sizes={product.sizes} variants={product.variants} priceLabel={formatPrice(product.price, currency)} />
        <dl className="mt-[50px] grid max-w-[560px] grid-cols-[140px_1fr] gap-y-[10px] border-t border-line pt-[24px] text-[15px]">
          <dt className="text-[#888]">Brand</dt>
          <dd className="text-ink">{product.brand}</dd>
          <dt className="text-[#888]">Category</dt>
          <dd className="text-ink">{CATEGORY_LABELS[product.category]}</dd>
          <dt className="text-[#888]">For</dt>
          <dd className="text-ink">{AUDIENCE_LABELS[product.audience]}</dd>
        </dl>
        {related.length > 0 && (
          <section aria-labelledby="related-title" className="mt-[80px]">
            <h2 id="related-title" className="text-center text-[28px] font-black uppercase text-ink lg:text-[34px]">
              You may also like
            </h2>
            <ul className="mt-[40px] grid grid-cols-2 gap-x-[20px] gap-y-[40px] lg:grid-cols-4 lg:gap-x-[34px]">
              {related.map((p) => (
                <li key={p.slug}>
                  <ProductCard product={toCard(p, formatPrice(p.price, currency))} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
