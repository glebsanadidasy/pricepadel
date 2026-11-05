import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/PageHero";
import { LimeButton } from "@/components/ui/Button";
import { Notice, SubmitButton } from "@/components/ui/Form";
import { requireUser } from "@/lib/auth";
import { charged, getOrderForUser, lastPaymentStatus } from "@/lib/orders";
import { payAgain } from "../actions";

export const metadata: Metadata = { title: "Order status", robots: { index: false } };

/** Where the gateway sends the customer back. The order status shown comes from our database, never from the URL. */
export default async function ResultPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const number = (await searchParams).order ?? "";
  const user = await requireUser(`/checkout/result?order=${encodeURIComponent(number)}`);
  const o = getOrderForUser(number, user.id);
  if (!o) notFound();
  const payment = lastPaymentStatus(o.id);
  const paid = o.status !== "Awaiting payment";
  return (
    <>
      <PageHero title={paid ? "Thank you" : "Payment not completed"} crumbs={[{ href: "/account/orders", label: "Orders" }]} />
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
              {payment === "declined" ? "Your card was declined." : payment === "cancelled" ? "The payment was cancelled." : "We haven’t received a payment confirmation yet."} Order{" "}
              <b>{o.number}</b> is waiting for payment — you have not been charged.
            </Notice>
            <form action={payAgain.bind(null, o.number)}>
              <SubmitButton>Try paying again</SubmitButton>
            </form>
          </>
        )}
        <p data-testid="result-status" className="text-[14px] text-[#888]">
          Order status: {o.status}
        </p>
        <div className="flex flex-wrap gap-[12px]">
          <LimeButton href={`/account/orders/${o.number}`}>View order</LimeButton>
          <Link href="/shop" className="inline-flex h-[44px] items-center px-[10px] text-royal underline">
            Continue shopping
          </Link>
        </div>
      </div>
    </>
  );
}
