"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { CurrencyCode } from "@/config/currency";
import { BUSINESS, INSTAGRAM_URL, MAIN_NAV } from "@/config/site";
import { Icon, type AnyIcon } from "@/components/ui/Icon";
import { CurrencySwitcher } from "./CurrencySwitcher";
import { MenuDrawer } from "./MenuDrawer";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="absolute -right-[16px] top-1/2 flex size-4 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[10px] leading-none text-[#222]">
      {count}
    </span>
  );
}

function IconLink({ href, label, icon, count, size = 20 }: { href: string; label: string; icon: AnyIcon; count?: number; size?: number }) {
  return (
    <Link href={href} aria-label={count === undefined ? label : `${label} (${count})`} className="relative flex h-6 items-center text-white hover:text-lime">
      <Icon name={icon} size={size} />
      {count !== undefined && <CountBadge count={count} />}
    </Link>
  );
}

/**
 * Header from Figma 3:18 (desktop) and 19:719–19:727 (mobile). On the home page it sits over the hero;
 * elsewhere it gets the hero blue as a solid background.
 */
export function Header({ currency }: { currency: CurrencyCode }) {
  const pathname = usePathname();
  const overHero = pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={`on-dark z-40 w-full text-white ${overHero ? "absolute inset-x-0 top-0" : "relative bg-hero"}`}>
      {/* Desktop */}
      <div className="mx-auto hidden h-[110px] max-w-[1290px] items-start px-[30px] lg:flex">
        <Link href="/" aria-label={`${BUSINESS.name} — home`} className="mt-[24px] shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/brand/logo.svg" alt="Price Padel" width={170} height={79} className="h-[79px] w-[170px]" />
        </Link>
        <div className="ml-[clamp(40px,5.8vw,112px)] flex flex-1 flex-col">
          <div className="mt-[5px] flex h-[31px] items-start justify-between border-b border-white/25 pt-[3px] text-[14px] leading-[20px]">
            <p>Premium padel gear. Fair prices.</p>
            <p className="flex items-center gap-[6px]">
              <Icon name="calendar" size={14} />
              {BUSINESS.hours}
            </p>
          </div>
          <div className="mt-[21px] flex h-[36px] items-center">
            <nav aria-label="Main" className="flex items-center gap-[clamp(22px,2.1vw,40px)] whitespace-nowrap">
              {MAIN_NAV.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className="relative flex h-[36px] items-center text-[14px] uppercase leading-[20px] hover:text-lime">
                    {item.label}
                    {active && <span className="absolute inset-x-0 bottom-0 h-[3px] bg-white" />}
                  </Link>
                );
              })}
              <a href={INSTAGRAM_URL ?? "/contact"} aria-label="Instagram" className="hover:text-lime">
                <Icon name="instagram" size={12} />
              </a>
            </nav>
            <div className="ml-auto flex items-center gap-[20px] pl-[24px]">
              <IconLink href="/shop" label="Search" icon="search" size={18} />
              <IconLink href="/account" label="My account" icon="user" size={21} />
              <span className="mr-[16px] flex gap-[36px]">
                <IconLink href="/wishlist" label="Wishlist" icon="heart" count={0} />
                <IconLink href="/cart" label="Cart" icon="bag" count={0} />
              </span>
              <CurrencySwitcher value={currency} className="ml-[4px]" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile and tablet */}
      <div className="relative px-[15px] pb-[12px] lg:hidden">
        <div className="relative flex h-[91px] items-start">
          <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen} className="mt-[56px] flex h-[22px] w-[22px] items-center">
            <Icon name="hamburger" size={22} />
          </button>
          <Link href="/" aria-label={`${BUSINESS.name} — home`} className="absolute left-1/2 top-[15px] -translate-x-1/2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/brand/logo.svg" alt="Price Padel" width={130} height={61} className="h-[61px] w-[130px]" />
          </Link>
          <div className="ml-auto mt-[34px] flex items-center gap-[18px] pr-[16px]">
            <IconLink href="/account" label="My account" icon="user" size={22} />
            <IconLink href="/cart" label="Cart" icon="bag" count={0} size={22} />
          </div>
        </div>
        <CurrencySwitcher value={currency} className="mt-[5px]" />
      </div>
      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
