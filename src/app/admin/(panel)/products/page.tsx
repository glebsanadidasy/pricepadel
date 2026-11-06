import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { markupFor, offSaleReason, readCatalog, readOffers, readSettings, retailPrice } from "@/lib/catalog-store";
import { AUDIENCE_LABELS, CATEGORY_LABELS, type Category } from "@/lib/catalog-types";
import { formatGbp } from "@/lib/currency";
import { setProductHidden } from "../../actions";

export const metadata: Metadata = { title: "Products" };

const PER_PAGE = 50;
const range = (xs: number[]) => (xs.length === 0 ? "—" : Math.min(...xs) === Math.max(...xs) ? formatGbp(xs[0]) : `${formatGbp(Math.min(...xs))} – ${formatGbp(Math.max(...xs))}`);

export default async function AdminProducts({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const q = await searchParams;
  const s = readSettings();
  const offers = readOffers();
  const all = readCatalog().map((p) => ({ p, offer: offers[p.id], reason: offSaleReason(p, offers[p.id], s) }));
  const term = (q.q ?? "").toLowerCase().trim();
  const filtered = all.filter(
    ({ p, reason }) =>
      (!term || `${p.name} ${p.brand} ${p.id}`.toLowerCase().includes(term)) &&
      (!q.category || p.category === q.category) &&
      (!q.status || (q.status === "on-sale" ? reason === null : q.status === "out-of-stock" ? reason === "out of stock" : reason !== null && reason !== "out of stock")),
  );
  const page = Math.max(1, Number(q.page) || 1);
  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const link = (p: number) => `/admin/products?${new URLSearchParams({ ...Object.fromEntries(Object.entries(q).filter(([, v]) => v) as [string, string][]), page: String(p) })}`;

  return (
    <div className="mt-[24px]">
      <form className="flex flex-wrap items-end gap-[10px] text-[14px]" action="/admin/products">
        <input name="q" defaultValue={q.q} placeholder="Name, brand or id" className="h-[38px] w-[240px] border border-line px-[8px]" />
        <select name="category" defaultValue={q.category ?? ""} className="h-[38px] border border-line px-[6px]">
          <option value="">All categories</option>
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={q.status ?? ""} className="h-[38px] border border-line px-[6px]">
          <option value="">Any status</option>
          <option value="on-sale">On sale</option>
          <option value="out-of-stock">Out of stock</option>
          <option value="hidden">Hidden</option>
        </select>
        <button className="h-[38px] bg-royal px-[16px] font-bold text-white">Filter</button>
        <span className="text-body">
          {filtered.length} of {all.length} products · {all.filter((x) => x.reason === null).length} on sale. Source prices and links are shown only here.
        </span>
      </form>
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
            {rows.map(({ p, offer, reason }) => {
              const m = markupFor(p, s);
              const vs = p.variants.map((v) => offer?.variants[v.sku]).filter((v) => !!v);
              const stock = vs.filter((v) => v.inStock);
              const priced = stock.length ? stock : vs;
              const hiddenByAdmin = s.hiddenProducts.includes(p.id);
              return (
                <tr key={p.id} className="border-b border-line align-top">
                  <td className="py-[8px] pr-[10px]">
                    {p.images[0] ? <Image src={p.images[0].src} alt="" width={56} height={56} className="size-[56px] object-contain" /> : <span className="text-[#888]">none</span>}
                  </td>
                  <td className="py-[8px] pr-[10px]">
                    <Link href={`/admin/products/${p.id}`} className="text-royal hover:underline">
                      {p.name}
                    </Link>
                    <span className="block text-[12px] text-[#888]">
                      {p.brand} · {p.images.length} photo(s) · {p.id}
                    </span>
                  </td>
                  <td className="py-[8px] pr-[10px]">
                    {CATEGORY_LABELS[p.category]}
                    <span className="block text-[#888]">{AUDIENCE_LABELS[p.audience]}</span>
                  </td>
                  <td className="py-[8px] pr-[10px]">
                    {stock.length}/{vs.length}
                  </td>
                  <td className="whitespace-nowrap py-[8px] pr-[10px]">{range(priced.map((v) => v.sourcePrice))}</td>
                  <td className="py-[8px] pr-[10px]">{Math.round((m - 1) * 1000) / 10}%</td>
                  <td className="whitespace-nowrap py-[8px] pr-[10px] font-bold text-ink">{range(priced.map((v) => retailPrice(v.sourcePrice, m, s.markup.minAmount)))}</td>
                  <td className="py-[8px] pr-[10px]">
                    {reason ? <span className="text-[#c0392b]">{reason}</span> : <span className="text-[#2e7d32]">On sale</span>}
                    <form action={setProductHidden.bind(null, p.id, !hiddenByAdmin)} className="mt-[4px]">
                      <button type="submit" className="text-[13px] text-royal underline">
                        {hiddenByAdmin ? "Show product" : "Hide product"}
                      </button>
                    </form>
                  </td>
                  <td className="py-[8px] pr-[10px]">
                    {offer ? (
                      <a href={offer.sourceUrl} target="_blank" rel="noreferrer noopener" className="text-royal underline">
                        open
                      </a>
                    ) : "—"}
                    <span className="block text-[12px] text-[#888]">
                      collected {p.collectedAt}
                      {offer && `, prices ${offer.priceCheckedAt.slice(0, 10)}`}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <nav aria-label="Pages" className="mt-[16px] flex flex-wrap gap-[10px] text-[14px]">
          {page > 1 && <Link href={link(page - 1)} className="text-royal underline">← Previous</Link>}
          <span>
            Page {page} of {pages}
          </span>
          {page < pages && <Link href={link(page + 1)} className="text-royal underline">Next →</Link>}
        </nav>
      )}
    </div>
  );
}
