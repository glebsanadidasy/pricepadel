"use client";

import Link from "next/link";
import { useActionState } from "react";
import { placeGuestOrder } from "@/app/checkout/actions";
import { COUNTRIES } from "@/config/countries";
import { Field, inputClass, Notice, SubmitButton } from "@/components/ui/Form";

/**
 * Guest checkout: every field the payment provider and the carrier need — e-mail, first name and surname,
 * phone with country code, UK address. All are checked again on the server. `summary` is the server-rendered order summary.
 */
export function GuestCheckoutForm({ expected, countries, summary }: { expected: string; countries: string[]; summary: React.ReactNode }) {
  const [state, action] = useActionState(placeGuestOrder, undefined);
  const v = state?.values ?? {};
  return (
    <form action={action} className="grid gap-[40px] lg:grid-cols-[1fr_380px]" aria-label="Guest checkout">
      <div className="space-y-[20px]">
        {state?.error && <Notice kind="error">{state.error}</Notice>}
        <p className="text-[15px]">
          Have an account?{" "}
          <Link href="/account/login?next=/checkout" className="text-royal underline">
            Sign in
          </Link>{" "}
          — or continue as a guest. We’ll e-mail you a private link to your order.
        </p>
        <section className="grid gap-[12px] sm:grid-cols-2">
          <h2 className="text-[18px] font-bold text-ink sm:col-span-2">Contact</h2>
          <Field label="E-mail" name="email" type="email" autoComplete="email" required defaultValue={v.email} />
          <Field label="Phone" name="phone" type="tel" autoComplete="tel" required placeholder="+44 7700 900123" hint="With the country code, e.g. +44." defaultValue={v.phone} />
        </section>
        <section className="grid gap-[12px] sm:grid-cols-2">
          <h2 className="text-[18px] font-bold text-ink sm:col-span-2">Delivery address</h2>
          <div className="sm:col-span-2">
            <Field label="Full name" name="full_name" autoComplete="name" required hint="First name and surname." defaultValue={v.full_name} />
          </div>
          <Field label="Address line 1" name="line1" autoComplete="address-line1" required defaultValue={v.line1} />
          <Field label="Address line 2" name="line2" autoComplete="address-line2" defaultValue={v.line2} />
          <Field label="City" name="city" autoComplete="address-level2" required defaultValue={v.city} />
          <Field label="Postcode" name="postcode" autoComplete="postal-code" required defaultValue={v.postcode} />
          <label className="block text-[14px] text-ink sm:col-span-2">
            <span className="font-bold">
              Country<span className="text-[#c0392b]"> *</span>
            </span>
            <select name="country" defaultValue={v.country || "GB"} autoComplete="country" className={`${inputClass} mt-[6px]`}>
              {COUNTRIES.filter(([code]) => countries.includes(code)).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <p className="text-[13px] text-[#888] sm:col-span-2">UK only, including Northern Ireland and the Scottish islands. We can’t deliver to the Channel Islands, the Isle of Man, BFPO or PO boxes.</p>
        </section>
      </div>
      <div className="self-start border border-line p-[22px]">
        {summary}
        <input type="hidden" name="expected" value={expected} />
        <label className="mt-[16px] flex items-start gap-[10px] text-[14px] leading-[20px]">
          <input type="checkbox" name="terms" value="yes" required className="mt-[3px] size-[16px] accent-royal" />
          <span>
            I have read and accept the{" "}
            <Link href="/policies/terms" target="_blank" className="text-royal underline">
              Terms &amp; Conditions
            </Link>
            .
          </span>
        </label>
        <SubmitButton className="mt-[16px] w-full">Pay by card</SubmitButton>
        <p className="mt-[10px] text-[13px] leading-[19px] text-body">You’ll pay by Visa or Mastercard on the payment provider’s secure page. We never see your card details.</p>
      </div>
    </form>
  );
}
