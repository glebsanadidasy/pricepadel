import type { Metadata } from "next";
import Link from "next/link";
import { adminButton, Card, dangerButton } from "@/components/admin/Card";
import { requireAdmin } from "@/lib/auth";
import { offSaleReason, readCatalog, readOffers, readSettings, readSourceRegistry } from "@/lib/catalog-store";
import { db } from "@/lib/db";
import { FX_CODES, rateInfo } from "@/lib/fx";
import { openLatePayments } from "@/lib/orders";
import { markLatePaymentReviewed, setSourceHidden } from "../actions";

export const metadata: Metadata = { title: "Overview" };

export default async function AdminOverview() {
  await requireAdmin();
  const s = readSettings();
  const items = readCatalog();
  const offers = readOffers();
  const registry = readSourceRegistry();
  const sources = [...new Set([...Object.keys(registry), ...items.map((p) => p.source)])];
  const reasons = new Map<string, number>();
  for (const p of items) {
    const r = offSaleReason(p, offers[p.id], s) ?? "on sale";
    reasons.set(r.replace(/\(.*\)/, "").trim(), (reasons.get(r.replace(/\(.*\)/, "").trim()) ?? 0) + 1);
  }
  const orders = db().prepare("SELECT status, COUNT(*) AS n FROM orders GROUP BY status").all() as { status: string; n: number }[];
  const deletions = db().prepare("SELECT id, email, deletion_requested_at FROM users WHERE deletion_requested_at IS NOT NULL ORDER BY deletion_requested_at").all() as {
    id: number;
    email: string;
    deletion_requested_at: string;
  }[];

  const late = openLatePayments();
  const openComplaints = (db().prepare("SELECT COUNT(*) AS n FROM data_complaints WHERE status = 'open'").get() as { n: number }).n;
  const fxProblems = FX_CODES.map((c) => ({ c, r: rateInfo(c, s.fx) })).filter((x) => !x.r.enabled);

  return (
    <>
    {late.length > 0 && (
      <div role="alert" className="mt-[20px] border-l-4 border-[#c0392b] bg-[#fdecea] px-[16px] py-[10px] text-[15px] text-ink">
        <p className="font-bold">Payment received for an order that had expired or was closed — check manually (refund or fulfil):</p>
        <ul className="mt-[6px] space-y-[4px]">
          {late.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center gap-[10px]">
              <Link href={`/admin/orders/${l.order_number}`} className="text-royal underline">
                {l.order_number}
              </Link>
              <span>
                {(l.amount / 100).toFixed(2)} {l.currency}, order was {l.order_status}, {l.at.slice(0, 16).replace("T", " ")}
              </span>
              <form action={markLatePaymentReviewed.bind(null, l.id)}>
                <button type="submit" className="text-[13px] text-royal underline">
                  Mark as checked
                </button>
              </form>
            </li>
          ))}
        </ul>
      </div>
    )}
    {openComplaints > 0 && (
      <p role="alert" className="mt-[20px] border-l-4 border-[#c0392b] bg-[#fdecea] px-[16px] py-[10px] text-[15px] text-ink">
        {openComplaints} open data protection complaint(s).{" "}
        <Link href="/admin/complaints" className="text-royal underline">
          Data complaints
        </Link>
      </p>
    )}
    {fxProblems.length > 0 && (
      <p role="alert" className="mt-[20px] border-l-4 border-[#c0392b] bg-[#fdecea] px-[16px] py-[10px] text-[15px] text-ink">
        Currency switched off: {fxProblems.map((x) => `${x.c} (${x.r.problem})`).join(", ")}. Customers see GBP only.{" "}
        <Link href="/admin/settings" className="text-royal underline">
          Exchange rates
        </Link>
      </p>
    )}
    <div className="mt-[24px] grid gap-[20px] lg:grid-cols-2">
      <Card title="Catalogue">
        <p>{items.length} products imported.</p>
        <ul className="mt-[8px] list-disc pl-[20px]">
          {[...reasons].sort((a, b) => b[1] - a[1]).map(([r, n]) => (
            <li key={r}>
              {r}: {n}
            </li>
          ))}
        </ul>
        <Link href="/admin/products" className="mt-[10px] inline-block text-royal underline">
          Products
        </Link>
      </Card>

      <Card title="Orders">
        {orders.length === 0 ? <p>No orders yet.</p> : (
          <ul className="list-disc pl-[20px]">
            {orders.map((o) => (
              <li key={o.status}>
                {o.status}: {o.n}
              </li>
            ))}
          </ul>
        )}
        <Link href="/admin/orders" className="mt-[10px] inline-block text-royal underline">
          All orders
        </Link>
      </Card>

      <Card title="Sources">
        <ul className="space-y-[16px]">
          {sources.map((id) => {
            const own = items.filter((p) => p.source === id);
            const hidden = s.hiddenSources.includes(id);
            const dates = own.map((p) => p.collectedAt).sort();
            return (
              <li key={id}>
                <p className="font-bold text-ink">
                  {registry[id]?.name ?? id}{" "}
                  {registry[id]?.url && (
                    <a href={registry[id].url} target="_blank" rel="noreferrer noopener" className="font-normal text-royal underline">
                      site
                    </a>
                  )}
                </p>
                <p>
                  {own.length} products, {own.reduce((n, p) => n + p.images.length, 0)} photos.
                  {dates.length > 0 && ` Collected ${dates[0]}${dates[0] !== dates[dates.length - 1] ? ` – ${dates[dates.length - 1]}` : ""}.`}
                </p>
                <form action={setSourceHidden.bind(null, id, !hidden)} className="mt-[8px]">
                  <button type="submit" className={hidden ? adminButton : dangerButton}>
                    {hidden ? "Show this source again" : "Hide everything from this source"}
                  </button>
                  {hidden && <span className="ml-[12px] font-bold text-[#c0392b]">Hidden: none of its products or photos are shown.</span>}
                </form>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card title="Account deletion requests">
        {deletions.length === 0 ? <p>None.</p> : (
          <ul className="list-disc pl-[20px]">
            {deletions.map((d) => (
              <li key={d.id}>
                {d.email} — {d.deletion_requested_at.slice(0, 10)}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
    </>
  );
}
