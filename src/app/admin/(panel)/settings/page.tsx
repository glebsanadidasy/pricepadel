import type { Metadata } from "next";
import { adminButton, adminInput, Card } from "@/components/admin/Card";
import { formatGbp } from "@/lib/currency";
import { requireAdmin } from "@/lib/auth";
import { readCatalog, readSettings } from "@/lib/catalog-store";
import { CATEGORY_LABELS, type Category } from "@/lib/catalog-types";
import { saveDeliveryCost, saveMarkups, saveRates, setRewriteApproved } from "../../actions";

export const metadata: Metadata = { title: "Prices & settings" };

const pct = (m: number | undefined) => (m === undefined ? "" : String(Math.round((m - 1) * 10000) / 100));
const pounds = (p: number) => (p / 100).toFixed(2);

export default async function SettingsPage() {
  await requireAdmin();
  const s = readSettings();
  const brands = [...new Set(readCatalog().map((p) => p.brand))].sort();
  const t = s.delivery.ourCostTiers;

  return (
    <div className="mt-[24px] grid gap-[20px] lg:grid-cols-2">
      <Card title="Markup">
        <form action={saveMarkups}>
          <p>Retail price = source price × (1 + markup). A brand markup wins over a category markup, which wins over the default. Leave a field empty to inherit.</p>
          <label className="mt-[12px] block font-bold text-ink">
            Default, % <input name="default" defaultValue={pct(s.markup.default)} inputMode="decimal" className={adminInput} required />
          </label>
          <div className="mt-[14px] grid gap-[24px] sm:grid-cols-2">
            <fieldset>
              <legend className="font-bold text-ink">By category, %</legend>
              {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
                <label key={c} className="mt-[6px] flex items-center justify-between gap-[10px]">
                  {CATEGORY_LABELS[c]} <input name={`category:${c}`} defaultValue={pct(s.markup.byCategory[c])} inputMode="decimal" className={adminInput} />
                </label>
              ))}
            </fieldset>
            <fieldset className="max-h-[420px] overflow-y-auto pr-[6px]">
              <legend className="font-bold text-ink">By brand, %</legend>
              {brands.map((b) => (
                <label key={b} className="mt-[6px] flex items-center justify-between gap-[10px]">
                  {b} <input name={`brand:${b}`} defaultValue={pct(s.markup.byBrand[b])} inputMode="decimal" className={adminInput} />
                </label>
              ))}
            </fieldset>
          </div>
          <button type="submit" className={`${adminButton} mt-[16px]`}>
            Save markups
          </button>
        </form>
      </Card>

      <div className="space-y-[20px]">
        <Card title="Exchange rates">
          <form action={saveRates} className="space-y-[8px]">
            <p>Prices are kept in GBP. Customers who choose euros or dollars see and pay GBP × rate.</p>
            <label className="flex items-center gap-[10px]">
              1 GBP = <input name="EUR" defaultValue={s.rates.EUR} inputMode="decimal" className={adminInput} /> EUR
            </label>
            <label className="flex items-center gap-[10px]">
              1 GBP = <input name="USD" defaultValue={s.rates.USD} inputMode="decimal" className={adminInput} /> USD
            </label>
            <button type="submit" className={adminButton}>
              Save rates
            </button>
          </form>
        </Card>

        <Card title="Delivery">
          <form action={saveDeliveryCost} className="space-y-[8px]">
            <label className="flex items-center gap-[10px]">
              Customer pays, £ <input name="customerPrice" defaultValue={pounds(s.delivery.customerPrice)} inputMode="decimal" className={adminInput} />
              <span className="text-[13px]">(0 = “Free delivery”)</span>
            </label>
            <p className="pt-[8px] font-bold text-ink">Our delivery cost (what we pay), by order value</p>
            <label className="flex items-center gap-[10px]">
              Under {formatGbp(t[0].below ?? 0)}: £ <input name="tier0" defaultValue={pounds(t[0].price)} inputMode="decimal" className={adminInput} />
            </label>
            <label className="flex items-center gap-[10px]">
              {formatGbp(t[0].below ?? 0)} – {formatGbp((t[1].below ?? 1) - 1)}: £ <input name="tier1" defaultValue={pounds(t[1].price)} inputMode="decimal" className={adminInput} />
            </label>
            <label className="flex items-center gap-[10px]">
              {formatGbp(t[1].below ?? 0)} and over: £ <input name="tier2" defaultValue={pounds(t[2].price)} inputMode="decimal" className={adminInput} />
            </label>
            <button type="submit" className={adminButton}>
              Save delivery
            </button>
          </form>
        </Card>

        <Card title="Descriptions">
          <p>
            Rewritten descriptions: <b>{s.rewriteApproved ? "approved" : "not approved"}</b>. Until approved the shop shows the collected descriptions, with sentences naming
            the source shop or promising delivery, returns or warranty removed. Nothing is rewritten automatically yet.
          </p>
          <form action={setRewriteApproved.bind(null, !s.rewriteApproved)} className="mt-[12px]">
            <button type="submit" className={adminButton}>
              {s.rewriteApproved ? "Withdraw approval" : "Approve rewriting (rewriteApproved)"}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
