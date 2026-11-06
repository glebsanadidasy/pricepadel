"use client";

import Link from "next/link";
import { useState } from "react";
import { CONSENT_COOKIE } from "@/config/consent";

export function saveConsent(choice: "accepted" | "rejected") {
  document.cookie = `${CONSENT_COOKIE}=${choice}; path=/; max-age=${180 * 24 * 3600}; samesite=lax`;
}

/**
 * Cookie notice with equal Accept and Reject buttons (same size, colour and position weight).
 * The site uses only strictly necessary cookies today; the choice is stored for when optional ones are added —
 * they will only ever be set after "Accept".
 */
export function CookieBanner({ show }: { show: boolean }) {
  const [open, setOpen] = useState(show);
  if (!open) return null;
  const choose = (c: "accepted" | "rejected") => {
    saveConsent(c);
    setOpen(false);
  };
  const button = "inline-flex h-[44px] min-w-[120px] items-center justify-center border-2 border-royal bg-white px-[20px] text-[14px] font-bold uppercase tracking-[1px] text-royal hover:bg-[#eef4fb]";
  return (
    <div role="dialog" aria-label="Cookies" aria-live="polite" className="fixed inset-x-0 bottom-[68px] z-[60] border-t border-line bg-white px-[15px] py-[16px] shadow-[0_-4px_16px_rgba(0,0,0,0.08)] lg:bottom-0">
      <div className="mx-auto flex max-w-site flex-col gap-[14px] lg:flex-row lg:items-center lg:justify-between">
        <p className="text-[14px] leading-[21px] text-body">
          We use only cookies that are strictly necessary for this site to work (sign-in, your cart and your currency choice). We don’t use analytics or advertising
          cookies. If we ever add optional cookies, we’ll only use them if you accept.{" "}
          <Link href="/policies/cookies" className="text-royal underline">
            Cookie Policy
          </Link>
        </p>
        <div className="flex shrink-0 gap-[10px]">
          <button type="button" onClick={() => choose("rejected")} className={button}>
            Reject
          </button>
          <button type="button" onClick={() => choose("accepted")} className={button}>
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

/** "Change cookie choice" button for the Cookie Policy page. */
export function CookieChoiceButtons() {
  const [done, setDone] = useState<string | null>(null);
  const button = "inline-flex h-[40px] items-center justify-center border-2 border-royal px-[16px] text-[14px] font-bold text-royal hover:bg-[#eef4fb]";
  return (
    <div className="flex flex-wrap items-center gap-[10px]">
      <button type="button" className={button} onClick={() => (saveConsent("rejected"), setDone("Optional cookies rejected."))}>
        Reject optional cookies
      </button>
      <button type="button" className={button} onClick={() => (saveConsent("accepted"), setDone("Optional cookies accepted."))}>
        Accept optional cookies
      </button>
      {done && <span role="status" className="text-[14px] text-[#2e7d32]">{done}</span>}
    </div>
  );
}
