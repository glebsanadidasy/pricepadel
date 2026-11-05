import type { Metadata } from "next";
import { formatPrice } from "@/config/currency";
import { requireAdmin } from "@/lib/admin";
import { offSaleReason, readImported, readSettings } from "@/lib/catalog-store";
import { CATEGORY_LABELS, type Category } from "@/lib/catalog-types";
import { saveMarkups, saveOurDeliveryCost, setRewriteApproved, setSourceHidden } from "./actions";

export const metadata: Metadata = { title: "Overview" };

const pct = (m: number | undefined) => (m === undefined ? "" : String(Math.round((m - 1) * 10000) / 100));
const gbp = (p: number) => formatPrice(p, "GBP");
const day = (iso: string) => iso.slice(0, 10);

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-line p-[20px]">
      <h2 className="text-[16px] font-bold uppercase tracking-[1px] text-ink">{title}</h2>
      <div className="mt-[14px] text-[15px] leading-[22px] text-body">{children}</div>
    </section>
  );
}

const input = "h-[36px] w-[80px] border border-line px-[8px] text-ink";
const button = "inline-flex h-[38px] items-center bg-royal px-[18px] text-[14px] font-bold text-white hover:bg-[#0b4a8f]";

export default function AdminOverview() {
  requireAdmin();
  const s = readSettings();
  const items = readImported();
  const brands = [...new Set(items.map((p) => p.brand))].sort();
  const sources = [...new Set([...Object.keys(s.sources), ...items.map((p) => p.source)])];

  return (
    <div className="mt-[24px] grid gap-[20px] lg:grid-cols-2">
      <Card title="Sources">
        {sources.length === 0 && <p>No products imported yet.</p>}
        <ul className="space-y-[16px]">
          {sources.map((id) => {
            const own = items.filter((p) => p.source === id);
            const hidden = s.hiddenSources.includes(id);
            const onSale = own.filter((p) => offSaleReason(p, s) === null).length;
            const dates = own.map((p) => p.scrapedAt).sort();
            return (
              <li key={id} className="border-b border-line pb-[14px] last:border-0">
                <p className="font-bold text-ink">
                  {s.sources[id]?.name ?? id}{" "}
                  {s.sources[id]?.url && (
                    <a href={s.sources[id].url} target="_blank" rel="noreferrer noopener" className="font-normal text-royal underline">
                      site
                    </a>
                  )}
                </p>
                <p>
                  {own.length} products, {own.reduce((n, p) => n + p.images.length, 0)} photos, {onSale} on sale.
                  {dates.length > 0 && ` Collected ${day(dates[0])}${day(dates[0]) !== day(dates[dates.length - 1]) ? ` – ${day(dates[dates.length - 1])}` : ""}.`}
                </p>
                <form action={setSourceHidden.bind(null, id, !hidden)} className="mt-[8px]">
                  <button type="submit" className={hidden ? button : "inline-flex h-[38px] items-center bg-[#c0392b] px-[18px] text-[14px] font-bold text-white hover:bg-[#a93226]"}>
                    {hidden ? "Show this source again" : "Hide everything from this source"}
                  </button>
                  {hidden && <span className="ml-[12px] font-bold text-[#c0392b]">Hidden: none of its products or photos are shown.</span>}
                </form>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card title="Delivery">
        <p>Customer price, shown as a separate line before payment:</p>
        <ul className="mt-[8px] list-disc pl-[20px]">
          {s.delivery.tiers.map((t, i) => {
            const from = i === 0 ? 0 : s.delivery.tiers[i - 1].below!;
            return (
              <li key={i}>
                {t.below === null ? `${gbp(from)} and over` : i === 0 ? `Under ${gbp(t.below)}` : `${gbp(from)} – ${gbp(t.below - 1)}`}: <b>{t.price === 0 ? "free" : gbp(t.price)}</b>
              </li>
            );
          })}
        </ul>
        <form action={saveOurDeliveryCost} className="mt-[16px] space-y-[10px]">
          <label className="block">
            Our delivery cost per order (what we pay), £{" "}
            <input name="ourCost" defaultValue={s.delivery.ourCost === null ? "" : (s.delivery.ourCost / 100).toFixed(2)} inputMode="decimal" className={input} />
          </label>
          <label className="block">
            Note <input name="ourCostNote" defaultValue={s.delivery.ourCostNote} className="h-[36px] w-full border border-line px-[8px] text-ink" />
          </label>
          <button type="submit" className={button}>
            Save
          </button>
          {s.delivery.ourCost === null && <p className="text-[14px] text-[#c0392b]">Not set yet.</p>}
        </form>
      </Card>

      <Card title="Markup">
        <form action={saveMarkups}>
          <p>Retail price = source price × (1 + markup). A brand markup wins over a category markup, which wins over the default. Leave a field empty to inherit.</p>
          <label className="mt-[12px] block font-bold text-ink">
            Default, % <input name="default" defaultValue={pct(s.markup.default)} inputMode="decimal" className={input} required />
          </label>
          <div className="mt-[14px] grid gap-[24px] sm:grid-cols-2">
            <fieldset>
              <legend className="font-bold text-ink">By category, %</legend>
              {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
                <label key={c} className="mt-[6px] flex items-center justify-between gap-[10px]">
                  {CATEGORY_LABELS[c]} <input name={`category:${c}`} defaultValue={pct(s.markup.byCategory[c])} inputMode="decimal" className={input} />
                </label>
              ))}
            </fieldset>
            <fieldset>
              <legend className="font-bold text-ink">By brand, %</legend>
              {brands.map((b) => (
                <label key={b} className="mt-[6px] flex items-center justify-between gap-[10px]">
                  {b} <input name={`brand:${b}`} defaultValue={pct(s.markup.byBrand[b])} inputMode="decimal" className={input} />
                </label>
              ))}
            </fieldset>
          </div>
          <button type="submit" className={`${button} mt-[16px]`}>
            Save markups
          </button>
        </form>
      </Card>

      <Card title="Descriptions">
        <p>
          Rewritten descriptions: <b>{s.rewriteApproved ? "approved" : "not approved"}</b>. Until this is approved the shop shows the collected descriptions,
          with sentences naming the source shop or promising delivery, returns or warranty removed. Nothing is rewritten automatically yet.
        </p>
        <form action={setRewriteApproved.bind(null, !s.rewriteApproved)} className="mt-[12px]">
          <button type="submit" className={button}>
            {s.rewriteApproved ? "Withdraw approval" : "Approve rewriting (rewriteApproved)"}
          </button>
        </form>
      </Card>
    </div>
  );
}
