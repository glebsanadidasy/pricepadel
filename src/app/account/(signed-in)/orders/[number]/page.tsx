import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderView } from "@/components/orders/OrderView";
import { requireUser } from "@/lib/auth";
import { expireStalePayments, getOrderForUser } from "@/lib/orders";

export const metadata: Metadata = { title: "Order" };

/** A customer can open only their own orders; anyone else's number answers "not found". */
export default async function OrderPage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ pay?: string }> }) {
  const { number } = await params;
  const payUnavailable = (await searchParams).pay === "unavailable";
  const user = await requireUser(`/account/orders/${number}`);
  expireStalePayments();
  const o = getOrderForUser(number, user.id);
  if (!o) notFound();
  return <OrderView o={o} payUnavailable={payUnavailable} />;
}
