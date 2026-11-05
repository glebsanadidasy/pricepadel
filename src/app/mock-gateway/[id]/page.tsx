import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatMinor, isCurrency } from "@/config/currency";
import { getPayment } from "@/lib/orders";
import { mockGatewayEnabled } from "@/lib/payments";

export const metadata: Metadata = { title: "Test payment page", robots: { index: false } };

/**
 * LOCAL SIMULATION of the payment gateway's hosted page. A real gateway shows its own card form here;
 * this page only lets you pick the outcome. It is switched off in production unless MOCK_PAYMENTS=1.
 */
export default async function MockGatewayPage({ params }: { params: Promise<{ id: string }> }) {
  if (!mockGatewayEnabled()) notFound();
  const p = getPayment((await params).id);
  if (!p) notFound();
  const amount = isCurrency(p.currency) ? formatMinor(p.amount, p.currency) : `${p.amount / 100} ${p.currency}`;
  return (
    <div className="mx-auto max-w-[480px] px-[15px] py-[60px]">
      <div className="border-2 border-dashed border-[#c0392b] p-[24px]">
        <p className="text-[13px] font-bold uppercase tracking-[1px] text-[#c0392b]">Test payment page — simulation, no real money</p>
        <h1 className="mt-[10px] text-[24px] font-bold text-ink">Pay {amount}</h1>
        <p className="mt-[6px] text-[15px]">Merchant: Price Padel · Order {p.order_number}</p>
        <p className="mt-[14px] text-[14px] leading-[21px] text-body">On the real payment provider’s page the customer enters Visa or Mastercard details here. Choose what the provider should report:</p>
        {p.status !== "created" ? (
          <p className="mt-[18px] text-[15px] font-bold text-ink">This payment is already {p.status}.</p>
        ) : (
          <form method="post" action={`/mock-gateway/${p.id}/complete`} className="mt-[18px] flex flex-wrap gap-[10px]">
            <button name="outcome" value="success" className="h-[44px] bg-[#2e7d32] px-[20px] font-bold text-white">
              Pay (success)
            </button>
            <button name="outcome" value="declined" className="h-[44px] bg-[#c0392b] px-[20px] font-bold text-white">
              Decline card
            </button>
            <button name="outcome" value="cancelled" className="h-[44px] border border-line px-[20px] text-ink">
              Cancel and return
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
