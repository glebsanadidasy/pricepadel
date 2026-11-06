"use client";

import { SubmitButton } from "@/components/ui/Form";

/** The checkout pay button with the wallet's logo (owner, stage 9). The logo file has a neutral name. */
export function PayButton({ disabled }: { disabled?: boolean }) {
  return (
    <SubmitButton className="mt-[16px] w-full gap-[10px]" disabled={disabled}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/payment/wallet.png" alt="" width={22} height={22} className="size-[22px] rounded-[4px] bg-white" />
      Pay by Wallet
    </SubmitButton>
  );
}
