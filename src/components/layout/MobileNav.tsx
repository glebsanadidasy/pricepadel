"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon, type AnyIcon } from "@/components/ui/Icon";
import { MenuDrawer } from "./MenuDrawer";

const ITEM = "flex h-[68px] flex-1 flex-col items-center justify-center gap-[2px] pt-[2px] text-[13px] leading-[16px] text-[#222]";

/** Bottom bar for phones (Figma 19:794): Home, Shop, Wishlist, More. */
export function MobileNav() {
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  const items: { href: string; label: string; icon: AnyIcon; badge?: number }[] = [
    { href: "/", label: "Home", icon: "navHome" },
    { href: "/shop", label: "Shop", icon: "navShop" },
    { href: "/wishlist", label: "Wishlist", icon: "navWishlist", badge: 0 },
  ];
  return (
    <>
      <nav aria-label="Quick links" className="fixed inset-x-0 bottom-0 z-50 flex border-t border-[#e5e5e5] bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        {items.map((it) => {
          const active = it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          return (
            <Link key={it.href} href={it.href} aria-current={active ? "page" : undefined} className={`${ITEM} ${active ? "text-royal" : ""}`}>
              <span className="relative">
                <Icon name={it.icon} size={23} />
                {it.badge !== undefined && (
                  <span className="absolute -right-[10px] -top-[3px] flex size-[14px] items-center justify-center rounded-full bg-royal text-[10px] leading-none text-white">{it.badge}</span>
                )}
              </span>
              {it.label}
            </Link>
          );
        })}
        <button type="button" onClick={() => setMore(true)} aria-expanded={more} className={ITEM}>
          <Icon name="more" size={23} />
          More
        </button>
      </nav>
      <MenuDrawer open={more} onClose={() => setMore(false)} />
    </>
  );
}
