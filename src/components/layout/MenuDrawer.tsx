"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { BUSINESS, COMPANY_LINKS, MAIN_NAV } from "@/config/site";
import { Icon } from "@/components/ui/Icon";

/** Slide-in menu for phones and tablets (hamburger in the header and "More" in the bottom bar). */
export function MenuDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  const links = [...MAIN_NAV, { href: "/account", label: "My account" }, { href: "/wishlist", label: "Wishlist" }, ...COMPANY_LINKS.filter((l) => !MAIN_NAV.some((m) => m.href === l.href))];

  return (
    <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <button type="button" aria-label="Close menu" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-black/40" />
      <nav className="absolute inset-y-0 left-0 flex w-[min(320px,85vw)] flex-col overflow-y-auto bg-white text-ink shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <span className="text-[14px] font-bold uppercase tracking-[1px]">Menu</span>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close menu" className="p-1">
            <Icon name="close" size={22} />
          </button>
        </div>
        <ul className="flex-1 py-2">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} onClick={onClose} className="block px-5 py-3 text-[15px] uppercase hover:bg-mist">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="border-t border-line px-5 py-4 text-[13px] leading-[20px] text-body">
          <p>{BUSINESS.hours}</p>
          <p>
            <a href={`mailto:${BUSINESS.email}`} className="underline">
              {BUSINESS.email}
            </a>
          </p>
        </div>
      </nav>
    </div>
  );
}
