"use client";

import Link from "next/link";
import { useActionState } from "react";
import { addAddress, login, register, updateProfile, type FormState } from "@/app/account/actions";
import { COUNTRIES } from "@/config/countries";
import { Field, inputClass, Notice, SubmitButton } from "@/components/ui/Form";

function Message({ state }: { state: FormState }) {
  if (state?.error) return <Notice kind="error">{state.error}</Notice>;
  if (state?.ok) return <Notice kind="ok">{state.ok}</Notice>;
  return null;
}

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-[16px]" aria-label="Sign in">
      <Message state={state} />
      <input type="hidden" name="next" value={next} />
      <Field label="E-mail" name="email" type="email" autoComplete="email" required defaultValue={state?.email} />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required />
      <SubmitButton>Sign in</SubmitButton>
      <p className="text-[14px]">
        New here?{" "}
        <Link href={`/account/register?next=${encodeURIComponent(next)}`} className="text-royal underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ next }: { next: string }) {
  const [state, action] = useActionState(register, undefined);
  return (
    <form action={action} className="space-y-[16px]" aria-label="Create an account">
      <Message state={state} />
      <input type="hidden" name="next" value={next} />
      <Field label="Name" name="name" autoComplete="name" />
      <Field label="E-mail" name="email" type="email" autoComplete="email" required defaultValue={state?.email} />
      <Field label="Password" name="password" type="password" autoComplete="new-password" required minLength={10} hint="At least 10 characters." />
      <SubmitButton>Create account</SubmitButton>
      <p className="text-[14px] leading-[21px]">
        We’ll send you a link to confirm your e-mail. Already have an account?{" "}
        <Link href={`/account/login?next=${encodeURIComponent(next)}`} className="text-royal underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function ProfileForm({ name }: { name: string }) {
  const [state, action] = useActionState(updateProfile, undefined);
  return (
    <form action={action} className="space-y-[12px]" aria-label="Profile">
      <Message state={state} />
      <Field label="Name" name="name" defaultValue={name} autoComplete="name" />
      <SubmitButton variant="plain">Save</SubmitButton>
    </form>
  );
}

/** `countries`: codes we deliver to now (from the admin settings). */
export function AddressForm({ back, countries }: { back?: string; countries: string[] }) {
  const [state, action] = useActionState(addAddress, undefined);
  return (
    <form action={action} className="grid gap-[12px] sm:grid-cols-2" aria-label="New address">
      <div className="sm:col-span-2">
        <Message state={state} />
      </div>
      {back && <input type="hidden" name="back" value={back} />}
      <Field label="Full name" name="full_name" autoComplete="name" required />
      <Field label="Phone" name="phone" type="tel" autoComplete="tel" />
      <Field label="Address line 1" name="line1" autoComplete="address-line1" required />
      <Field label="Address line 2" name="line2" autoComplete="address-line2" />
      <Field label="City" name="city" autoComplete="address-level2" required />
      <Field label="Postcode" name="postcode" autoComplete="postal-code" required />
      <label className="block text-[14px] text-ink sm:col-span-2">
        <span className="font-bold">
          Country<span className="text-[#c0392b]"> *</span>
        </span>
        <select name="country" defaultValue="GB" autoComplete="country" className={`${inputClass} mt-[6px]`}>
          {COUNTRIES.filter(([code]) => countries.includes(code)).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <div className="sm:col-span-2">
        <SubmitButton variant="plain">Save address</SubmitButton>
      </div>
    </form>
  );
}
