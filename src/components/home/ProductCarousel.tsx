"use client";

import { useRef } from "react";
import { ProductCard, type CardProduct } from "@/components/shop/ProductCard";
import { Icon } from "@/components/ui/Icon";

/** "Best products for this season" — scrollable row, four visible on desktop, one on phones (Figma 3:235 / 19:634). */
export function ProductCarousel({ products }: { products: CardProduct[] }) {
  const track = useRef<HTMLUListElement>(null);
  const scroll = (d: number) => {
    const el = track.current;
    if (!el) return;
    const item = el.querySelector("li");
    el.scrollBy({ left: d * (item ? item.clientWidth + 34 : el.clientWidth), behavior: "smooth" });
  };
  return (
    <div className="relative">
      <ul ref={track} className="no-scrollbar flex snap-x snap-mandatory gap-[34px] overflow-x-auto scroll-smooth">
        {products.map((p) => (
          <li key={p.slug} className="w-[calc(100%-20px)] shrink-0 snap-start sm:w-[calc(50%-17px)] lg:w-[calc(25%-25.5px)]">
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => scroll(-1)} aria-label="Previous products" className="absolute left-[-6px] top-[34%] -translate-y-1/2 p-2 text-[#555] hover:text-royal lg:left-[-48px]">
        <Icon name="chevronRight" size={16} className="rotate-180" />
      </button>
      <button type="button" onClick={() => scroll(1)} aria-label="Next products" className="absolute right-[-6px] top-[34%] -translate-y-1/2 p-2 text-[#555] hover:text-royal lg:right-[-48px]">
        <Icon name="chevronRight" size={16} />
      </button>
    </div>
  );
}
