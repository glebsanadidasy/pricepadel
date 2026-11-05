"use client";

import { useFormStatus } from "react-dom";

/** Form building blocks shared by account, checkout and admin pages. */
export const inputClass = "h-[44px] w-full border border-line bg-white px-[12px] text-[15px] text-ink focus:border-royal";

export function Field({ label, name, type = "text", defaultValue, required, autoComplete, hint, ...rest }: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  autoComplete?: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-[14px] text-ink">
      <span className="font-bold">
        {label}
        {required && <span className="text-[#c0392b]"> *</span>}
      </span>
      <input name={name} type={type} defaultValue={defaultValue} required={required} autoComplete={autoComplete} className={`${inputClass} mt-[6px]`} {...rest} />
      {hint && <span className="mt-[4px] block text-[13px] text-[#888]">{hint}</span>}
    </label>
  );
}

export function SubmitButton({ children, className = "", variant = "lime", ...rest }: { children: React.ReactNode; className?: string; variant?: "lime" | "plain" | "danger" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();
  const look =
    variant === "lime"
      ? "bg-lime text-royal hover:bg-[#b8e600] font-bold uppercase tracking-[1px] px-[28px]"
      : variant === "danger"
        ? "bg-[#c0392b] text-white hover:bg-[#a93226] font-bold px-[20px]"
        : "border border-line text-ink hover:border-ink px-[18px]";
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={`inline-flex h-[44px] items-center justify-center text-[14px] disabled:opacity-60 ${look} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Notice({ kind = "info", children }: { kind?: "info" | "error" | "ok"; children: React.ReactNode }) {
  const look = kind === "error" ? "border-[#c0392b] bg-[#fdecea]" : kind === "ok" ? "border-[#2e7d32] bg-[#eaf6ec]" : "border-lime bg-[#f7fbe5]";
  return (
    <p role={kind === "error" ? "alert" : "status"} className={`border-l-4 px-[16px] py-[10px] text-[14px] leading-[21px] text-ink ${look}`}>
      {children}
    </p>
  );
}
