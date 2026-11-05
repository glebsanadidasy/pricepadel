import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { charged, listOrders, orderItems } from "@/lib/orders";

export const metadata: Metadata = { title: "Orders" };

export default async function AdminOrders() {
  await requireAdmin();
  const orders = listOrders(500);
  return (
    <div className="mt-[24px] overflow-x-auto">
      {orders.length === 0 ? <p className="text-[15px]">No orders yet.</p> : (
        <table className="w-full min-w-[760px] border-collapse text-left text-[14px]">
          <thead>
            <tr className="border-b-2 border-ink text-[12px] uppercase text-ink">
              <th className="py-[8px]">Order</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-line">
                <td className="py-[8px]">
                  <Link href={`/admin/orders/${o.number}`} className="font-bold text-royal hover:underline">
                    {o.number}
                  </Link>
                </td>
                <td>{o.created_at.slice(0, 16).replace("T", " ")}</td>
                <td>{o.email}</td>
                <td>{orderItems(o).reduce((n, i) => n + i.qty, 0)}</td>
                <td>{charged(o)}</td>
                <td>{o.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
