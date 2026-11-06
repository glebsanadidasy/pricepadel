import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/PageHero";
import { OrderView } from "@/components/orders/OrderView";
import { viewableOrder } from "@/lib/order-access";
import { expireStalePayments } from "@/lib/orders";

export const metadata: Metadata = { title: "Your order", robots: { index: false, follow: false } };

/**
 * A guest's order: opened with the private link from the e-mail (?t=…) or from the browser that placed it (cookie).
 * Without the right token every order number answers "not found".
 */
export default async function GuestOrderPage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ t?: string; pay?: string; from?: string }> }) {
  const { number } = await params;
  const q = await searchParams;
  expireStalePayments();
  const access = await viewableOrder(number, q.t);
  if (!access || !access.guest) notFound();
  return (
    <>
      <PageHero title="Your order" crumbs={[{ href: `/orders/${number}`, label: number }]} />
      <div className="mx-auto max-w-site px-[15px] pb-[80px] pt-[36px] lg:px-0">
        <OrderView o={access.order} payUnavailable={q.pay === "unavailable"} token={q.t} fromPayment={q.from === "payment"} />
      </div>
    </>
  );
}
