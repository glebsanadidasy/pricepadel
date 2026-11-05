import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/config/currency";
import { requireAdmin } from "@/lib/admin";
import { markupFor, offSaleReason, readImported, readSettings, retailPrice } from "@/lib/catalog-store";
import { AUDIENCE_LABELS, CATEGORY_LABELS } from "@/lib/catalog-types";

export const metadata: Metadata = { title: "Products" };

const gbp = (p: number) => formatPrice(p, "GBP");
const range = (xs: number[]) => {
  const lo = Math.min(...xs);
  const hi = Math.max(...xs);
  return lo === hi ? gbp(lo) : `${gbp(lo)} – ${gbp(hi)}`;
};

export default function AdminProducts() {
  requireAdmin();
  const s = readSettings();
  const items = [...readImported()].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  const onSale = items.filter((p) => offSaleReason(p, s) === null).length;

  return (
    <div className="mt-[24px]">
      <p className="text-[15px] text-body">
        {items.length} imported, {onSale} on sale. Source prices and links are shown only here.
      </p>
      <div className="mt-[16px] overflow-x-auto">
        <table className="w-full min-w-[1100px] border-collapse text-left text-[14px] leading-[19px]">
          <thead>
            <tr className="border-b-2 border-ink text-[12px] uppercase tracking-[0.5px] text-ink">
              <th className="py-[8px] pr-[10px]">Photo</th>
              <th className="pr-[10px]">Product</th>
              <th className="pr-[10px]">Category / for</th>
              <th className="pr-[10px]">In stock</th>
              <th className="pr-[10px]">Source price</th>
              <th className="pr-[10px]">Markup</th>
              <th className="pr-[10px]">Our price</th>
              <th className="pr-[10px]">Status</th>
              <th className="pr-[10px]">Source</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => {
              const m = markupFor(p, s);
              const stock = p.variants.filter((v) => v.inStock);
              const priced = stock.length ? stock : p.variants;
              const reason = offSaleReason(p, s);
              return (
                <tr key={p.id} className="border-b border-line align-top">
                  <td className="py-[8px] pr-[10px]">
                    {p.images[0] ? <Image src={p.images[0].src} alt="" width={56} height={56} className="size-[56px] object-contain" /> : <span className="text-[#c0392b]">none</span>}
                  </td>
                  <td className="py-[8px] pr-[10px]">
                    {reason ? (
                      <span className="text-ink">{p.name}</span>
                    ) : (
                      <Link href={`/product/${p.slug}`} className="text-royal hover:underline">
                        {p.name}
                      </Link>
                    )}
                    <br />
                    <span className="text-[12px] text-[#888]">
                      {p.brand} · {p.images.length} photo{p.images.length === 1 ? "" : "s"} · source SKU {p.sourceSku}
                    </span>
                  </td>
                  <td className="py-[8px] pr-[10px]">
                    {CATEGORY_LABELS[p.category]}
                    <br />
                    <span className="text-[#888]">{AUDIENCE_LABELS[p.audience]}</span>
                  </td>
                  <td className="py-[8px] pr-[10px]">
                    {stock.length}/{p.variants.length}
                    {p.variants.some((v) => v.size) && <span className="block text-[12px] text-[#888]">{stock.map((v) => v.size).filter(Boolean).join(", ")}</span>}
                  </td>
                  <td className="whitespace-nowrap py-[8px] pr-[10px]">{range(priced.map((v) => v.sourcePrice))}</td>
                  <td className="py-[8px] pr-[10px]">{Math.round((m - 1) * 1000) / 10}%</td>
                  <td className="whitespace-nowrap py-[8px] pr-[10px] font-bold text-ink">{range(priced.map((v) => retailPrice(v.sourcePrice, m)))}</td>
                  <td className="py-[8px] pr-[10px]">{reason ? <span className="text-[#c0392b]">Hidden: {reason}</span> : <span className="text-[#2e7d32]">On sale</span>}</td>
                  <td className="py-[8px] pr-[10px]">
                    <a href={p.sourceUrl} target="_blank" rel="noreferrer noopener" className="text-royal underline">
                      {s.sources[p.source]?.name ?? p.source}
                    </a>
                    <span className="block text-[12px] text-[#888]">
                      collected {p.scrapedAt.slice(0, 10)}, prices {p.priceCheckedAt.slice(0, 10)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
