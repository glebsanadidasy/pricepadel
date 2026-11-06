"use client";

import { useEffect, useRef, useState } from "react";
import { emptyCartAfterPayment } from "@/app/cart/actions";

export type PaymentFrame = { checkoutUrl: string; embedUrl: string; resultUrl: string; orderUrl: string; origins: string[] };

/**
 * The payment provider's checkout page inside our site: the page behind is blurred, the frame fills the phone screen
 * or sits in a centred window on desktop. Touch, scrolling and keyboard work inside the frame as on the provider's page.
 * Messages from the frame are accepted only from the provider's origins and only close the window — whether the order is
 * paid is decided on the server from the signed notification. "Open in full window" is always there as a fallback.
 */
export function PaymentModal({ frame }: { frame: PaymentFrame }) {
  const [loaded, setLoaded] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const body = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onMessage = (e: MessageEvent) => {
      if (!frame.origins.includes(e.origin)) return;
      const ev = typeof e.data === "object" && e.data ? String((e.data as { event?: unknown }).event ?? "") : "";
      if (ev === "payment.success" || ev === "payment.failed") window.location.assign(frame.resultUrl);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("message", onMessage);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = body;
      window.removeEventListener("message", onMessage);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame]);

  function close() {
    if (window.confirm("Leave the payment? Your order is saved and you can pay for it later.")) window.location.assign(frame.orderUrl);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch justify-center bg-[#0c0c0c]/55 backdrop-blur-[6px] sm:items-center sm:p-[24px]" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Secure payment"
        className="flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-[min(860px,92dvh)] sm:max-w-[520px] sm:rounded-[14px]"
      >
        <div className="flex min-h-[54px] shrink-0 items-center gap-[10px] border-b border-line px-[14px] py-[6px] pt-[max(6px,env(safe-area-inset-top))]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/payment/wallet.png" alt="" width={24} height={24} className="size-[24px] rounded-[5px]" />
          <p className="min-w-0 flex-1 text-[15px] font-bold leading-tight text-ink">
            Secure payment
            <span className="block text-[12px] font-normal text-[#2e7d32] sm:ml-[8px] sm:inline sm:align-middle">🔒 card details stay with the payment provider</span>
          </p>
          <button ref={closeRef} type="button" onClick={close} aria-label="Close payment" className="flex size-[36px] items-center justify-center rounded-full text-[22px] leading-none text-ink hover:bg-mist">
            ×
          </button>
        </div>
        <div className="relative flex-1 overscroll-contain">
          {!loaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-[12px] text-[14px] text-body" aria-live="polite">
              <span className="size-[34px] animate-spin rounded-full border-[3px] border-line border-t-royal" />
              Loading the secure payment page…
            </div>
          )}
          <iframe
            src={frame.embedUrl}
            title="Secure payment page"
            onLoad={() => setLoaded(true)}
            allow="payment *; publickey-credentials-get *; clipboard-write"
            referrerPolicy="strict-origin-when-cross-origin"
            className={`absolute inset-0 h-full w-full border-0 transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          />
        </div>
        <p className="shrink-0 border-t border-line px-[14px] py-[8px] pb-[max(8px,env(safe-area-inset-bottom))] text-center text-[13px] text-[#888]">
          Payment page not showing?{" "}
          <a href={frame.checkoutUrl} target="_top" rel="noopener" className="text-royal underline">
            Open it in the full window
          </a>
        </p>
      </div>
    </div>
  );
}

/** On the result page: if the provider sent the customer back inside our payment frame, continue in the full window. */
export function LeavePaymentFrame() {
  useEffect(() => {
    if (window.top && window.top !== window.self) window.top.location.replace(window.location.href);
  }, []);
  return null;
}

/** Back from the payment window (`?from=payment`): the order is saved, so the cart is emptied once. */
export function EmptyCartAfterPayment({ when }: { when: boolean }) {
  useEffect(() => {
    if (when && window.top === window.self) void emptyCartAfterPayment();
  }, [when]);
  return null;
}
