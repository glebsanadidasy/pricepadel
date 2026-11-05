import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { AutoSubmit } from "@/components/shop/AutoSubmit";
import { FilterToggle } from "@/components/shop/FilterToggle";
import { ProductCard, toCard } from "@/components/shop/ProductCard";
import { Icon } from "@/components/ui/Icon";
import { formatPrice } from "@/config/currency";
import { filterOptions, listProducts, parseFilters, PRICE_BANDS, SHOW_TEST_PRODUCTS, SORTS, type Filters } from "@/lib/catalog";
import { AUDIENCE_LABELS, CATEGORY_LABELS, type Audience, type Category } from "@/lib/catalog-types";
import { getCurrency } from "@/lib/currency";

export const metadata: Metadata = {
  title: "Shop",
  description: "Padel rackets, shoes, bags, balls, apparel and accessories for men, women and kids.",
};

function Group({ title, children, open = true }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-b border-line py-[16px]">
      <summary className="flex cursor-pointer list-none items-center justify-between text-[14px] font-bold uppercase tracking-[1px] text-ink [&::-webkit-details-marker]:hidden">
        {title}
        <Icon name="chevronDown" size={16} className="transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-[12px] space-y-[8px]">{children}</div>
    </details>
  );
}

function Check({ name, value, label, checked, count, type = "checkbox" }: { name: string; value: string; label: string; checked: boolean; count?: number; type?: "checkbox" | "radio" }) {
  const disabled = !checked && count === 0;
  return (
    <label className={`flex cursor-pointer items-center gap-[10px] text-[15px] leading-[20px] ${disabled ? "cursor-default text-[#bbb]" : "text-body hover:text-ink"}`}>
      <input type={type} name={name} value={value} defaultChecked={checked} disabled={disabled} className="size-[16px] accent-royal" />
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="text-[13px] text-[#999]">{count}</span>}
    </label>
  );
}

function activeChips(f: Filters) {
  const chips: { label: string; param: string; value: string }[] = [];
  f.category.forEach((c) => chips.push({ label: CATEGORY_LABELS[c], param: "category", value: c }));
  f.audience.forEach((a) => chips.push({ label: AUDIENCE_LABELS[a], param: "for", value: a }));
  f.brand.forEach((b) => chips.push({ label: b, param: "brand", value: b }));
  f.size.forEach((s) => chips.push({ label: s, param: "size", value: s }));
  if (f.price) chips.push({ label: PRICE_BANDS.find((b) => b.value === f.price)!.label, param: "price", value: f.price });
  return chips;
}

function withoutParam(params: Record<string, string | string[] | undefined>, param: string, value: string) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) for (const x of Array.isArray(v) ? v : v ? [v] : []) if (!(k === param && x === value)) qs.append(k, x);
  const s = qs.toString();
  return s ? `/shop?${s}` : "/shop";
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const f = parseFilters(params);
  const currency = await getCurrency();
  const products = listProducts(f);
  const opts = filterOptions(f);
  const chips = activeChips(f);
  const title = f.category.length === 1 ? CATEGORY_LABELS[f.category[0]] : "Shop";
  const brands = [...opts.brand.keys()].sort();
  const sizes = [...opts.size.keys()].sort((a, b) => parseFloat(a.replace(/\D+/g, "")) - parseFloat(b.replace(/\D+/g, "")));

  return (
    <>
      <PageHero title={title} crumbs={[{ href: "/shop", label: "Shop" }]} />
      <div className="mx-auto max-w-site px-[15px] pb-[90px] pt-[36px] lg:px-0">
        {SHOW_TEST_PRODUCTS && (
          <p className="mb-[24px] border-l-4 border-lime bg-[#f7fbe5] px-[16px] py-[10px] text-[14px] text-body">
            Preview: these are sample products from the design mockup. They are not part of the live catalogue.
          </p>
        )}
        <div className="grid gap-[36px] lg:grid-cols-[250px_1fr]">
          <form action="/shop" method="get" aria-label="Filter products" className="lg:sticky lg:top-[20px] lg:self-start">
            <AutoSubmit />
            <FilterToggle count={chips.length}>
              <FilterGroups f={f} opts={opts} brands={brands} sizes={sizes} />
            </FilterToggle>
            {f.sort !== "featured" && <input type="hidden" name="sort" value={f.sort} />}
            <noscript>
              <button type="submit" className="mt-[16px] h-[44px] w-full bg-lime text-[14px] font-bold uppercase text-royal">
                Show results
              </button>
            </noscript>
          </form>

          <section aria-label="Products">
            <div className="flex flex-wrap items-center justify-between gap-[12px] border-b border-line pb-[14px]">
              <p className="text-[15px]" aria-live="polite">
                {products.length} {products.length === 1 ? "product" : "products"}
              </p>
              <form action="/shop" method="get" className="flex items-center gap-[8px] text-[14px]">
                <AutoSubmit />
                {Object.entries(params).flatMap(([k, v]) =>
                  k === "sort" ? [] : (Array.isArray(v) ? v : v ? [v] : []).map((x) => <input key={`${k}-${x}`} type="hidden" name={k} value={x} />),
                )}
                <label htmlFor="sort">Sort by</label>
                <select id="sort" name="sort" defaultValue={f.sort} className="h-[36px] border border-line bg-white px-[8px] text-ink">
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </form>
            </div>
            {chips.length > 0 && (
              <ul className="mt-[14px] flex flex-wrap gap-[8px]" aria-label="Active filters">
                {chips.map((c) => (
                  <li key={`${c.param}-${c.value}`}>
                    <Link href={withoutParam(params, c.param, c.value)} className="inline-flex items-center gap-[6px] rounded-full bg-mist px-[12px] py-[5px] text-[13px] text-ink hover:bg-[#e4e4e4]">
                      {c.label} <Icon name="close" size={12} />
                      <span className="sr-only">— remove filter</span>
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/shop" className="inline-block px-[6px] py-[5px] text-[13px] text-royal underline">
                    Clear all
                  </Link>
                </li>
              </ul>
            )}
            {products.length === 0 ? (
              <div className="py-[80px] text-center">
                <p className="text-[18px] text-ink">No products match these filters.</p>
                <Link href="/shop" className="mt-[12px] inline-block text-royal underline">
                  Clear filters and show everything
                </Link>
              </div>
            ) : (
              <ul className="mt-[36px] grid grid-cols-2 gap-x-[20px] gap-y-[48px] md:grid-cols-3 lg:gap-x-[34px]">
                {products.map((p) => (
                  <li key={p.slug}>
                    <ProductCard product={toCard(p, formatPrice(p.price, currency))} sizes="(min-width: 1024px) 270px, 50vw" />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function FilterGroups({ f, opts, brands, sizes }: { f: Filters; opts: ReturnType<typeof filterOptions>; brands: string[]; sizes: string[] }) {
  return (
    <>
      <Group title="Category">
        {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
          <Check key={c} name="category" value={c} label={CATEGORY_LABELS[c]} checked={f.category.includes(c)} count={opts.category.get(c) ?? 0} />
        ))}
      </Group>
      <Group title="For">
        {(["men", "women", "kids"] as Audience[]).map((a) => (
          <Check key={a} name="for" value={a} label={AUDIENCE_LABELS[a]} checked={f.audience.includes(a)} count={opts.audience.get(a) ?? 0} />
        ))}
      </Group>
      <Group title="Brand">
        {brands.length === 0 && <p className="text-[14px] text-[#999]">No brands yet</p>}
        {brands.map((b) => (
          <Check key={b} name="brand" value={b} label={b} checked={f.brand.includes(b)} count={opts.brand.get(b)} />
        ))}
      </Group>
      <Group title="Price">
        <Check name="price" value="" label="Any price" checked={!f.price} type="radio" />
        {PRICE_BANDS.map((b) => (
          <Check key={b.value} name="price" value={b.value} label={b.label} checked={f.price === b.value} count={opts.price.get(b.value) ?? 0} type="radio" />
        ))}
      </Group>
      <Group title="Size" open={f.size.length > 0}>
        {sizes.length === 0 && <p className="text-[14px] text-[#999]">No sizes for this selection</p>}
        <div className="flex flex-wrap gap-[8px]">
          {sizes.map((s) => (
            <label key={s} className="cursor-pointer">
              <input type="checkbox" name="size" value={s} defaultChecked={f.size.includes(s)} className="peer sr-only" />
              <span className="inline-flex h-[34px] min-w-[52px] items-center justify-center border border-line px-[8px] text-[13px] text-ink peer-checked:border-royal peer-checked:bg-royal peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-royal">
                {s}
              </span>
            </label>
          ))}
        </div>
      </Group>
    </>
  );
}
