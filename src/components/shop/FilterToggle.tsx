"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

/** On phones the filter groups fold behind one button; on desktop they are always shown. */
export function FilterToggle({ count, children }: { count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="filter-groups"
        className="flex h-[44px] w-full items-center justify-center gap-[8px] border border-line text-[14px] font-bold uppercase tracking-[1px] text-ink lg:hidden"
      >
        <Icon name="filter" size={18} /> {open ? "Hide filters" : "Filters"}
        {count > 0 ? ` (${count})` : ""}
      </button>
      <div id="filter-groups" className={`${open ? "block" : "hidden"} pt-[8px] lg:block lg:pt-0`}>
        {children}
      </div>
    </>
  );
}
