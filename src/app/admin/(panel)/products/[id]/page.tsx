import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminButton, Card, dangerButton } from "@/components/admin/Card";
import { requireAdmin } from "@/lib/auth";
import { markupFor, offSaleReason, readCatalog, readOffers, readSettings, retailPrice } from "@/lib/catalog-store";
import { formatGbp } from "@/lib/currency";
import { setPhotoHidden, setProductHidden } from "../../../actions";

export const metadata: Metadata = { title: "Product" };

export default async function AdminProduct({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const p = readCatalog().find((x) => x.id === id);
  if (!p) notFound();
  const s = readSettings();
  const offer = readOffers()[p.id];
  const reason = offSaleReason(p, offer, s);
  const m = markupFor(p, s);
  const hidden = s.hiddenProducts.includes(p.id);
  const photos = [...new Map(p.images.map((i) => [i.src, i])).values()];

  return (
    <div className="mt-[24px] space-y-[20px]">
      <Card title={p.name}>
        <p>
          {p.brand} · {p.category} · {p.audience} · {p.id} · status: <b>{reason ?? "on sale"}</b>
          {reason === null && (
            <>
              {" "}
              ·{" "}
              <Link href={`/product/${p.slug}`} className="text-royal underline">
                public page
              </Link>
            </>
          )}
        </p>
        {offer && (
          <p className="mt-[6px]">
            Source:{" "}
            <a href={offer.sourceUrl} target="_blank" rel="noreferrer noopener" className="text-royal underline">
              {offer.sourceUrl}
            </a>{" "}
            · source SKU {offer.sourceSku} · collected {offer.scrapedAt.slice(0, 10)} · prices checked {offer.priceCheckedAt.slice(0, 10)}
          </p>
        )}
        <form action={setProductHidden.bind(null, p.id, !hidden)} className="mt-[12px]">
          <button type="submit" className={hidden ? adminButton : dangerButton}>
            {hidden ? "Show this product again" : "Hide this product"}
          </button>
        </form>
      </Card>

      <Card title="Variants">
        <table className="w-full border-collapse text-left text-[14px]">
          <thead>
            <tr className="border-b border-ink text-[12px] uppercase text-ink">
              <th className="py-[6px]">SKU</th>
              <th>Colour</th>
              <th>Size</th>
              <th>Stock</th>
              <th>Source price</th>
              <th>Our price</th>
            </tr>
          </thead>
          <tbody>
            {p.variants.map((v) => {
              const o = offer?.variants[v.sku];
              return (
                <tr key={v.sku} className="border-b border-line">
                  <td className="py-[6px]">{v.sku}</td>
                  <td>{v.colour || "—"}</td>
                  <td>{v.size ?? "—"}</td>
                  <td>{o?.inStock ? "in stock" : "out"}</td>
                  <td>{o ? formatGbp(o.sourcePrice) : "—"}</td>
                  <td className="font-bold text-ink">{o ? formatGbp(retailPrice(o.sourcePrice, m)) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Card title="Photos">
        <ul className="grid grid-cols-2 gap-[14px] sm:grid-cols-4 lg:grid-cols-6">
          {photos.map((img) => {
            const off = s.hiddenPhotos.includes(img.src);
            return (
              <li key={img.src} className={`border p-[6px] ${off ? "border-[#c0392b] opacity-50" : "border-line"}`}>
                <div className="relative aspect-square">
                  <Image src={img.src} alt="" fill sizes="200px" className="object-contain" />
                </div>
                <p className="mt-[4px] truncate text-[12px] text-[#888]">{img.colour ?? "all colours"}</p>
                <form action={setPhotoHidden.bind(null, img.src, !off)}>
                  <button type="submit" className="text-[13px] text-royal underline">
                    {off ? "Show photo" : "Hide photo"}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
