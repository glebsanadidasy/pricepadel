import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/PageHero";
import { EmptyCartAfterPayment, LeavePaymentFrame } from "@/components/checkout/PaymentModal";
import { AutoRefresh } from "@/components/shop/AutoRefresh";
import { LimeButton } from "@/components/ui/Button";
import { Notice, SubmitButton } from "@/components/ui/Form";
import { orderPath, viewableOrder } from "@/lib/order-access";
import { charged, expireStalePayments, lastPaymentStatus } from "@/lib/orders";
import { payAgain } from "../actions";

export const metadata: Metadata = { title: "Order status", robots: { index: false } };

/** Where the gateway sends the customer back. The order status shown comes from our database, never from the URL. */
export default async function ResultPage({ searchParams }: { searchParams: Promise<{ order?: string; from?: string }> }) {
  const q = await searchParams;
  const number = q.order ?? "";
  expireStalePayments();
  // The customer who placed it, or the guest browser holding its private token; anyone else: not found.
  const access = await viewableOrder(number);
  if (!access) notFound();
  const o = access.order;
  const view = orderPath(o.number, access.guest);
  const payment = lastPaymentStatus(o.id);
  const paid = o.status !== "Awaiting payment" && o.status !== "Expired";
  return (
    <>
      <LeavePaymentFrame />
      <EmptyCartAfterPayment when={q.from === "payment"} />
      <PageHero title={paid ? "Thank you" : payment === "created" ? "Checking your payment" : "Payment not completed"} crumbs={[{ href: view, label: o.number }]} />
      <div className="mx-auto max-w-[680px] space-y-[18px] px-[15px] pb-[80px] pt-[40px]">
        {paid ? (
          <>
            <Notice kind="ok">
              Payment received for order <b>{o.number}</b> ({charged(o)}). A confirmation has been sent to {o.email}.
            </Notice>
            <p className="text-[15px]">We’ll check availability and let you know when your order ships.</p>
          </>
        ) : (
          <>
            <Notice kind="error">
              {payment === "expired"
                ? "The time to pay ran out."
                : payment === "declined"
                ? "Your card was declined."
                : payment === "cancelled"
                  ? "The payment was cancelled."
                  : "We’re checking your payment with the payment provider. This page updates by itself."}{" "}
              Order <b>{o.number}</b> is waiting for payment confirmation{payment === "created" ? "" : " — you have not been charged"}.
            </Notice>
            {payment === "created" ? (
              <AutoRefresh />
            ) : o.status === "Expired" ? (
              <LimeButton href={view}>Order again</LimeButton>
            ) : (
              <form action={payAgain.bind(null, o.number, undefined)}>
                <SubmitButton>Try paying again</SubmitButton>
              </form>
            )}
          </>
        )}
        <p data-testid="result-status" className="text-[14px] text-[#888]">
          Order status: {o.status}
        </p>
        <div className="flex flex-wrap gap-[12px]">
          <LimeButton href={view}>View order</LimeButton>
          <Link href="/shop" className="inline-flex h-[44px] items-center px-[10px] text-royal underline">
            Continue shopping
          </Link>
        </div>
      </div>
    </>
  );
}
