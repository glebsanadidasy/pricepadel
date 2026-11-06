"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { CURRENCIES, CURRENCY_COOKIE, type CurrencyCode } from "@/config/currency";
import { Flag } from "@/components/ui/Flag";
import { Icon } from "@/components/ui/Icon";

function saveCurrency(code: CurrencyCode) {
  document.cookie = `${CURRENCY_COOKIE}=${code}; path=/; max-age=31536000; samesite=lax`;
}

/** Pill with flag, currency name and chevron (Figma 19:396 / 19:727). Choice is kept in a cookie for a year. */
/** `available`: currencies with a fresh exchange rate (GBP always); the others are not offered. */
export function CurrencySwitcher({ value, available, className = "" }: { value: CurrencyCode; available: CurrencyCode[]; className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  function choose(code: CurrencyCode) {
    setOpen(false);
    if (code === value) return;
    saveCurrency(code);
    startTransition(() => router.refresh());
  }

  const current = CURRENCIES[value];
  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`Currency: ${current.label}`}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-[30px] w-[158px] items-center gap-[8px] rounded-[3px] border border-[#dedede] bg-white pl-[7px] pr-[4px] text-left text-[11.5px] leading-[14px] tracking-[-0.1px] text-[#222] ${pending ? "opacity-70" : ""}`}
      >
        <Flag code={current.flag} />
        <span className="flex-1 truncate">{current.label}</span>
        <Icon name="chevronDown" size={16} className="text-[#555]" />
      </button>
      {open && (
        <ul id={listId} role="listbox" aria-label="Choose currency" className="absolute left-0 top-[calc(100%+4px)] z-50 w-[158px] overflow-hidden rounded-[3px] border border-[#dedede] bg-white py-1 text-[12px] text-[#222] shadow-lg">
          {available.map((code) => (
            <li key={code} role="option" aria-selected={code === value}>
              <button type="button" onClick={() => choose(code)} className={`flex w-full items-center gap-2 px-[7px] py-[7px] text-left hover:bg-[#f4f4f4] ${code === value ? "font-bold" : ""}`}>
                <Flag code={CURRENCIES[code].flag} />
                {CURRENCIES[code].label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
