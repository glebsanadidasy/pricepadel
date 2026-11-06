"use client";

import { useActionState } from "react";
import { placeOrder } from "@/app/checkout/actions";
import { PaymentModal } from "./PaymentModal";

/** Checkout form for signed-in customers; opens the payment window once the order is created. */
export function AccountPayForm({ className, children }: { className?: string; children: React.ReactNode }) {
  const [state, action] = useActionState(placeOrder, undefined);
  return (
    <>
      <form action={action} className={className} aria-label="Your order">
        {children}
      </form>
      {state?.frame && <PaymentModal frame={state.frame} />}
    </>
  );
}
