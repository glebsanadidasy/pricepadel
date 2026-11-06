import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SubmitButton } from "@/components/ui/Form";
import { countryName } from "@/config/countries";
import { formatMinor } from "@/config/currency";
import { requireUser } from "@/lib/auth";
import { charged, getOrderForUser, orderAddress, orderEvents, orderItems } from "@/lib/orders";
import { payAgain } from "@/app/checkout/actions";

export const metadata: Metadata = { title: "Order" };

/** A customer can open only their own orders; anyone else's number answers "not found". */
export default async function OrderPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const user = await requireUser(`/account/orders/${number}`);
  const o = getOrderForUser(number, user.id);
  if (!o) notFound();
  const a = orderAddress(o);
  return (
    <div className="max-w-[760px] space-y-[24px]">
      <div className="flex flex-wrap items-center gap-[12px]">
        <h2 className="text-[22px] font-bold text-ink">Order {o.number}</h2>
        <span className="rounded-[3px] bg-mist px-[8px] py-[2px] text-[14px] text-ink" data-testid="order-status">
          {o.status}
        </span>
      </div>
      {o.tracking_number && (
        <p className="text-[15px]">
          Tracking number: <b className="text-ink">{o.tracking_number}</b>
        </p>
      )}
      {o.status === "Awaiting payment" && (
        <form action={payAgain.bind(null, o.number)}>
          <SubmitButton>Pay now</SubmitButton>
        </form>
      )}
      <ul className="divide-y divide-line border-y border-line text-[15px]">
        {orderItems(o).map((i) => (
          <li key={i.sku} className="flex justify-between gap-[12px] py-[10px]">
            <span>
              {i.qty} ×{" "}
              <Link href={`/product/${i.slug}`} className="text-royal hover:underline">
                {i.name}
              </Link>{" "}
              <span className="text-[#888]">{[i.colour, i.size].filter(Boolean).join(" · ")}</span>
            </span>
            <span className="whitespace-nowrap text-ink">{formatMinor(i.unitPrice * i.qty, "GBP")}</span>
          </li>
        ))}
      </ul>
      <dl className="space-y-[6px] text-[15px]">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{formatMinor(o.subtotal_gbp, "GBP")}</dd>
        </div>
        <div className="flex justify-between">
          <dt>{o.delivery_gbp === 0 ? "Free delivery" : "Delivery"}</dt>
          <dd>{formatMinor(o.delivery_gbp, "GBP")}</dd>
        </div>
        <div className="flex justify-between font-bold text-ink">
          <dt>Total</dt>
          <dd>{charged(o)}</dd>
        </div>
      </dl>
      <section className="text-[15px] leading-[22px]">
        <h3 className="font-bold text-ink">Delivery address</h3>
        <p>
          {a.full_name}, {a.line1}
          {a.line2 && `, ${a.line2}`}, {a.postcode} {a.city}, {countryName(a.country)}
        </p>
      </section>
      <section className="text-[14px]">
        <h3 className="font-bold text-ink">History</h3>
        <ul className="mt-[6px] space-y-[4px]">
          {orderEvents(o.id).map((e, i) => (
            <li key={i}>
              {e.at.slice(0, 16).replace("T", " ")} — {e.status}
              {e.note && !e.note.startsWith("Payment pay_") ? ` (${e.note})` : ""}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
