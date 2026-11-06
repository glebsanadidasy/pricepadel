"use client";

import { useActionState, useState } from "react";
import { submitDataComplaint } from "@/app/contact/actions";
import { Field, inputClass, Notice, SubmitButton } from "@/components/ui/Form";

export function DataComplaintForm() {
  const [state, action] = useActionState(submitDataComplaint, undefined);
  const [started] = useState(() => Date.now());
  if (state?.ok) return <Notice kind="ok">{state.ok}</Notice>;
  return (
    <form action={action} className="grid gap-[12px] sm:grid-cols-2" aria-label="Data protection complaint">
      {state?.error && (
        <div className="sm:col-span-2">
          <Notice kind="error">{state.error}</Notice>
        </div>
      )}
      <input type="hidden" name="started" value={started} />
      {/* Honeypot: hidden from people, filled in by spam bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label>
          Website <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <Field label="Your name" name="name" autoComplete="name" required />
      <Field label="E-mail" name="email" type="email" autoComplete="email" required />
      <Field label="Order number (if any)" name="order" />
      <label className="block text-[14px] text-ink sm:col-span-2">
        <span className="font-bold">
          Your complaint<span className="text-[#c0392b]"> *</span>
        </span>
        <textarea name="message" required minLength={10} maxLength={5000} rows={6} className={`${inputClass} mt-[6px] h-auto py-[10px]`} />
      </label>
      <div className="sm:col-span-2">
        <SubmitButton>Send complaint</SubmitButton>
      </div>
    </form>
  );
}
