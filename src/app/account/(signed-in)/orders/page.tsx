import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { charged, listOrdersForUser, orderItems } from "@/lib/orders";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage() {
  const user = await requireUser("/account/orders");
  const orders = listOrdersForUser(user.id);
  return (
    <section>
      <h2 className="text-[18px] font-bold text-ink">Your orders</h2>
      {orders.length === 0 ? (
        <p className="mt-[8px] text-[15px]">No orders yet.</p>
      ) : (
        <ul className="mt-[12px] divide-y divide-line border-y border-line">
          {orders.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-[10px] py-[14px] text-[15px]">
              <Link href={`/account/orders/${o.number}`} className="font-bold text-royal hover:underline">
                {o.number}
              </Link>
              <span>{o.created_at.slice(0, 10)}</span>
              <span>{orderItems(o).reduce((n, i) => n + i.qty, 0)} item(s)</span>
              <span className="text-ink">{charged(o)}</span>
              <span className="rounded-[3px] bg-mist px-[8px] py-[2px] text-[13px] text-ink">{o.status}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
