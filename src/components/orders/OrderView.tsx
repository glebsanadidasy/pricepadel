import Link from "next/link";
import { Notice, SubmitButton } from "@/components/ui/Form";
import { countryName } from "@/config/countries";
import { formatMinor } from "@/config/currency";
import { charged, orderAddress, orderEvents, orderItems, type OrderRow } from "@/lib/orders";
import { orderAgain, payAgain } from "@/app/checkout/actions";

/** One order, as its customer (account or guest with the private link) sees it. */
export function OrderView({ o, payUnavailable, token }: { o: OrderRow; payUnavailable: boolean; token?: string }) {
  const a = orderAddress(o);
  return (
    <div className="max-w-[760px] space-y-[24px]">
      <div className="flex flex-wrap items-center gap-[12px]">
        <h2 className="text-[22px] font-bold text-ink">Order {o.number}</h2>
        <span className="rounded-[3px] bg-mist px-[8px] py-[2px] text-[14px] text-ink" data-testid="order-status">
          {o.status}
        </span>
      </div>
      {payUnavailable && o.status === "Awaiting payment" && (
        <Notice kind="error">Card payment is temporarily unavailable. Your order is saved and nothing has been charged — please try “Pay now” again later.</Notice>
      )}
      {o.tracking_number && (
        <p className="text-[15px]">
          Tracking number: <b className="text-ink">{o.tracking_number}</b>
        </p>
      )}
      {o.status === "Expired" && (
        <div className="space-y-[10px]">
          <Notice>The time to pay for this order ran out and you have not been charged. You can order the same items again.</Notice>
          <form action={orderAgain.bind(null, o.number, token)}>
            <SubmitButton>Order again</SubmitButton>
          </form>
        </div>
      )}
      {o.status === "Awaiting payment" && (
        <form action={payAgain.bind(null, o.number, token)}>
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
