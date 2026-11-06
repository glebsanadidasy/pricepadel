import type { Metadata } from "next";
import { adminButton, adminInput, Card } from "@/components/admin/Card";
import { formatGbp } from "@/lib/currency";
import { requireAdmin } from "@/lib/auth";
import { readCatalog, readSettings } from "@/lib/catalog-store";
import { CATEGORY_LABELS, type Category } from "@/lib/catalog-types";
import { FX_CODES, rateInfo } from "@/lib/fx";
import { refreshRatesNow, saveDelivery, saveFx, saveMarkups, setRewriteApproved } from "../../actions";

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
          <p>
            Retail price = the larger of source price × (1 + markup) and source price + minimum markup. A brand markup wins over a category markup, which wins over the
            default. Leave a field empty to inherit.
          </p>
          <label className="mt-[12px] block font-bold text-ink">
            Default, % <input name="default" defaultValue={pct(s.markup.default)} inputMode="decimal" className={adminInput} required />
          </label>
          <label className="mt-[8px] block font-bold text-ink">
            Minimum markup, £ <input name="minAmount" defaultValue={pounds(s.markup.minAmount)} inputMode="decimal" className={adminInput} required />
          </label>
          <label className="mt-[8px] block text-ink">
            Card fee assumption for the margin report, % <input name="gatewayFeePct" defaultValue={s.assumptions.gatewayFeePct} inputMode="decimal" className={adminInput} />
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
          <p>
            Prices are kept in GBP. Shown rate = ECB reference rate (updated daily) + margin, or your manual rate. A rate older than 3 days switches that
            currency off. Customers pay exactly the amount shown.
          </p>
          {s.fx.lastError && <p className="mt-[6px] text-[13px] text-[#c0392b]">Last ECB update failed: {s.fx.lastError}</p>}
          <form action={saveFx} className="mt-[12px] space-y-[10px]">
            <label className="flex items-center gap-[10px]">
              Margin over ECB, % <input name="marginPct" defaultValue={s.fx.marginPct} inputMode="decimal" className={adminInput} />
            </label>
            <table className="w-full border-collapse text-left text-[14px]">
              <thead>
                <tr className="border-b border-ink text-[12px] uppercase text-ink">
                  <th className="py-[4px]">1 GBP =</th>
                  <th>ECB</th>
                  <th>In use</th>
                  <th>Manual</th>
                </tr>
              </thead>
              <tbody>
                {FX_CODES.map((c) => {
                  const r = rateInfo(c, s.fx);
                  return (
                    <tr key={c} className="border-b border-line align-top">
                      <td className="py-[6px] font-bold text-ink">{c}</td>
                      <td>
                        {s.fx[c].ecb ?? "—"}
                        <span className="block text-[12px] text-[#888]">{s.fx[c].ecbDate?.slice(0, 10) ?? "never"}</span>
                      </td>
                      <td>
                        {r.rate ?? "—"} {r.source && <span className="text-[12px] text-[#888]">({r.source})</span>}
                        <span className={`block text-[12px] font-bold ${r.enabled ? "text-[#2e7d32]" : "text-[#c0392b]"}`}>{r.enabled ? "on" : `OFF — ${r.problem}`}</span>
                      </td>
                      <td>
                        <input name={`manual:${c}`} defaultValue={s.fx[c].manual ?? ""} inputMode="decimal" className={adminInput} placeholder="ECB" />
                        {s.fx[c].manualAt && (
                          <label className="mt-[4px] flex items-center gap-[6px] text-[12px]">
                            <input type="checkbox" name={`renew:${c}`} value="yes" /> still valid (set {s.fx[c].manualAt.slice(0, 10)})
                          </label>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex flex-wrap gap-[10px]">
              <button type="submit" className={adminButton}>
                Save rates
              </button>
            </div>
          </form>
          <form action={refreshRatesNow} className="mt-[10px]">
            <button type="submit" className="text-[14px] text-royal underline">
              Update from ECB now
            </button>
            {s.fx.fetchedAt && <span className="ml-[8px] text-[13px] text-[#888]">last checked {s.fx.fetchedAt.slice(0, 16).replace("T", " ")}</span>}
          </form>
        </Card>

        <Card title="Delivery">
          <form action={saveDelivery} className="space-y-[8px]">
            <p className="font-bold text-ink">Customer pays</p>
            <label className="flex items-center gap-[10px]">
              Delivery, £ <input name="customerPrice" defaultValue={pounds(s.delivery.customer.price)} inputMode="decimal" className={adminInput} />
            </label>
            <label className="flex items-center gap-[10px]">
              Free from order value, £ <input name="freeFrom" defaultValue={pounds(s.delivery.customer.freeFrom)} inputMode="decimal" className={adminInput} />
            </label>
            <label className="flex items-center gap-[10px]">
              Countries (codes) <input name="countries" defaultValue={s.delivery.countries.join(", ")} className="h-[36px] w-[160px] border border-line px-[8px] text-ink" />
              <span className="text-[13px]">GB = UK only</span>
            </label>
            <label className="flex flex-wrap items-center gap-[10px]">
              Blocked postcode areas <input name="blockedPostcodes" defaultValue={s.delivery.blockedPostcodes.join(", ")} className="h-[36px] w-[200px] border border-line px-[8px] text-ink" />
              <span className="text-[13px]">GY, JE = Channel Islands, IM = Isle of Man</span>
            </label>
            <label className="flex items-center gap-[8px]">
              <input type="checkbox" name="noPoBoxes" value="yes" defaultChecked={s.delivery.noPoBoxes} /> No delivery to PO boxes
            </label>
            <p className="pt-[8px] font-bold text-ink">Our delivery cost (what we pay), by order value at the source</p>
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
