import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminButton, Card } from "@/components/admin/Card";
import { countryName } from "@/config/countries";
import { requireAdmin } from "@/lib/auth";
import { ourDeliveryCost, readOffers, readSettings } from "@/lib/catalog-store";
import { formatGbp } from "@/lib/currency";
import { charged, getOrder, ORDER_STATUSES, orderAddress, orderEvents, orderItems } from "@/lib/orders";
import { changeOrderStatus } from "../../../actions";

export const metadata: Metadata = { title: "Order" };

export default async function AdminOrder({ params }: { params: Promise<{ number: string }> }) {
  await requireAdmin();
  const o = getOrder((await params).number);
  if (!o) notFound();
  const offers = readOffers();
  const items = orderItems(o);
  const a = orderAddress(o);
  const sourceTotal = items.reduce((n, i) => n + (offers[i.productId]?.variants[i.sku]?.sourcePrice ?? 0) * i.qty, 0);
  const deliveryCost = ourDeliveryCost(sourceTotal, readSettings().delivery.ourCostTiers);
  // Paid / Awaiting payment come only from the payment flow; an unpaid order can only be cancelled.
  // Paid, Awaiting payment and Expired come only from the payment flow; unpaid or expired orders can only be cancelled.
  const allowed =
    o.status === "Awaiting payment" || o.status === "Expired" ? (["Cancelled"] as const) : ORDER_STATUSES.filter((s) => s !== "Paid" && s !== "Awaiting payment" && s !== "Expired");

  return (
    <div className="mt-[24px] grid gap-[20px] lg:grid-cols-[1fr_380px]">
      <Card title={`Order ${o.number} — ${o.status}`}>
        <p>
          {o.email} · placed {o.created_at.slice(0, 16).replace("T", " ")} · {o.paid_at ? `paid ${o.paid_at.slice(0, 16).replace("T", " ")}` : "not paid"}
        </p>
        <table className="mt-[12px] w-full border-collapse text-left text-[14px]">
          <thead>
            <tr className="border-b border-ink text-[12px] uppercase text-ink">
              <th className="py-[6px]">Item</th>
              <th>Qty</th>
              <th>Our price</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => {
              const offer = offers[i.productId];
              const v = offer?.variants[i.sku];
              return (
                <tr key={i.sku} className="border-b border-line align-top">
                  <td className="py-[6px]">
                    {i.name}
                    <span className="block text-[12px] text-[#888]">
                      {[i.colour, i.size].filter(Boolean).join(" · ")} · {i.sku}
                    </span>
                  </td>
                  <td>{i.qty}</td>
                  <td>{formatGbp(i.unitPrice)}</td>
                  <td>
                    {offer ? (
                      <a href={offer.sourceUrl} target="_blank" rel="noreferrer noopener" className="text-royal underline">
                        {v ? formatGbp(v.sourcePrice) : "link"}
                      </a>
                    ) : (
                      "—"
                    )}
                    {v && <span className="block text-[12px] text-[#888]">{v.inStock ? "in stock" : "OUT OF STOCK"} · {v.sourceSku}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <dl className="mt-[12px] grid grid-cols-[1fr_auto] gap-y-[4px] text-[14px]">
          <dt>Subtotal</dt>
          <dd>{formatGbp(o.subtotal_gbp)}</dd>
          <dt>Customer delivery</dt>
          <dd>{o.delivery_gbp === 0 ? "Free" : formatGbp(o.delivery_gbp)}</dd>
          <dt className="font-bold">Charged</dt>
          <dd className="font-bold">
            {charged(o)}
            {o.currency !== "GBP" && ` (${formatGbp(o.total_gbp)} at ${o.rate})`}
          </dd>
          <dt>Source cost (today)</dt>
          <dd>{formatGbp(sourceTotal)}</dd>
          <dt>Our delivery cost</dt>
          <dd>{formatGbp(deliveryCost)}</dd>
          <dt className="font-bold">Margin before card fees</dt>
          <dd className="font-bold">{formatGbp(o.total_gbp - sourceTotal - deliveryCost)}</dd>
        </dl>
        <h3 className="mt-[16px] font-bold text-ink">Delivery address</h3>
        <p>
          {a.full_name}, {a.line1}
          {a.line2 && `, ${a.line2}`}, {a.postcode} {a.city}, {countryName(a.country)} {a.phone && `· ${a.phone}`}
        </p>
      </Card>
      <div className="space-y-[20px]">
        <Card title="Status">
          {allowed.length === 0 ? <p>No changes possible.</p> : (
            <form action={changeOrderStatus.bind(null, o.number)} className="space-y-[10px]">
              <select name="status" defaultValue={(allowed as readonly string[]).includes(o.status) ? o.status : allowed[0]} className="h-[38px] w-full border border-line px-[8px] text-ink">
                {allowed.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <input name="tracking" defaultValue={o.tracking_number ?? ""} placeholder="Tracking number (sent with “Shipped”)" className="h-[38px] w-full border border-line px-[8px]" />
              <input name="note" placeholder="Note (optional)" className="h-[38px] w-full border border-line px-[8px]" />
              <button type="submit" className={adminButton}>
                Update status
              </button>
              <p className="text-[13px]">“Paid” is set only by a verified payment notification.</p>
            </form>
          )}
        </Card>
        <Card title="History">
          <ul className="space-y-[4px] text-[14px]">
            {orderEvents(o.id).map((e, i) => (
              <li key={i}>
                {e.at.slice(0, 16).replace("T", " ")} — <b>{e.status}</b> ({e.actor}) {e.note}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
