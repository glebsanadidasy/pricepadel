"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/catalog-types";
import { NoPhoto } from "./ProductCard";

type Props = Pick<Product, "name" | "images" | "colours" | "sizes"> & {
  variants: (Product["variants"][number] & { priceLabel: string })[];
  /** Shown until a variant is chosen, e.g. "£95.83" or "From £20.80". */
  priceLabel: string;
  /** Server-rendered notes under the buy buttons (delivery rates). */
  children?: React.ReactNode;
};

/** Gallery + colour and size selection (in-stock options only). Buying needs an account, so the button leads to sign-in for now. */
export function VariantPicker({ name, images, colours, sizes, variants, priceLabel, children }: Props) {
  const [image, setImage] = useState(0);
  const [colour, setColour] = useState(colours.length === 1 ? colours[0].name : "");
  const [size, setSize] = useState("");
  const [tried, setTried] = useState(false);

  const activeColour = colour || (colours.length <= 1 ? (colours[0]?.name ?? "") : "");
  const sizesForColour = new Set(variants.filter((v) => !activeColour || v.colour === activeColour).map((v) => v.size));
  const needColour = colours.length > 1 && !colour;
  const needSize = sizes.length > 0 && !size;
  const variant = needColour || needSize ? undefined : variants.find((v) => v.colour === activeColour && (sizes.length === 0 || v.size === size));
  const main = images[image];

  return (
    <div className="grid gap-[40px] lg:grid-cols-[minmax(0,560px)_1fr] lg:gap-[70px]">
      <div className="min-w-0">
        <div className="relative aspect-square w-full bg-white">
          {main ? <Image src={main.src} alt={main.alt} fill preload sizes="(min-width: 1024px) 560px, 100vw" className="object-contain" /> : <NoPhoto className="absolute inset-0" />}
        </div>
        {images.length > 1 && (
          <ul className="mt-[14px] flex flex-wrap gap-[8px] lg:gap-[10px]" aria-label="Product photos">
            {images.map((img, i) => (
              <li key={img.src}>
                <button type="button" onClick={() => setImage(i)} aria-label={`Show photo ${i + 1}`} aria-pressed={i === image} className={`relative block size-[60px] border lg:size-[80px] ${i === image ? "border-royal" : "border-line"}`}>
                  <Image src={img.src} alt="" fill sizes="80px" className="object-contain" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h1 className="text-[28px] font-bold leading-[34px] text-ink lg:text-[34px] lg:leading-[40px]">{name}</h1>
        <p className="mt-[14px] text-[26px] font-bold leading-[30px] text-royal" aria-live="polite">
          {variant?.priceLabel ?? priceLabel}
        </p>

        {colours.length > 0 && (
          <fieldset className="mt-[30px]">
            <legend className="text-[14px] font-bold uppercase tracking-[1px] text-ink">
              Colour{colour && <span className="ml-[8px] font-normal normal-case tracking-normal text-body">{colour}</span>}
            </legend>
            <div className="mt-[12px] flex flex-wrap gap-[10px]">
              {colours.map((c) => (
                <label key={c.name} className="cursor-pointer" title={c.name}>
                  <input
                    type="radio"
                    name="colour"
                    value={c.name}
                    checked={colour === c.name}
                    onChange={() => {
                      setColour(c.name);
                      if (size && !variants.some((v) => v.colour === c.name && v.size === size)) setSize("");
                    }}
                    className="peer sr-only"
                  />
                  <span className="block rounded-full border-2 border-transparent p-[3px] peer-checked:border-royal peer-focus-visible:outline-2 peer-focus-visible:outline-royal">
                    <span className="block size-[30px] rounded-full border border-black/15" style={{ background: c.swatch }} />
                  </span>
                  <span className="sr-only">{c.name}</span>
                </label>
              ))}
            </div>
            {tried && needColour && <p className="mt-[8px] text-[14px] text-[#c0392b]">Choose a colour.</p>}
          </fieldset>
        )}

        {sizes.length > 0 && (
          <fieldset className="mt-[26px]">
            <legend className="text-[14px] font-bold uppercase tracking-[1px] text-ink">
              Size{size && <span className="ml-[8px] font-normal normal-case tracking-normal text-body">{size}</span>}
            </legend>
            <div className="mt-[12px] flex flex-wrap gap-[8px]">
              {sizes.map((s) => {
                const available = sizesForColour.has(s);
                return (
                  <label key={s} className={available ? "cursor-pointer" : "cursor-not-allowed"}>
                    <input type="radio" name="size" value={s} checked={size === s} disabled={!available} onChange={() => setSize(s)} className="peer sr-only" />
                    <span className="inline-flex h-[42px] min-w-[64px] items-center justify-center border border-line px-[10px] text-[14px] text-ink hover:border-ink peer-checked:border-royal peer-checked:bg-royal peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-royal peer-disabled:border-dashed peer-disabled:text-[#bbb] peer-disabled:hover:border-line">
                      {s}
                    </span>
                  </label>
                );
              })}
            </div>
            {tried && needSize && <p className="mt-[8px] text-[14px] text-[#c0392b]">Choose a size.</p>}
          </fieldset>
        )}

        <div className="mt-[34px] flex flex-wrap items-center gap-[14px]">
          {needColour || needSize ? (
            <button type="button" onClick={() => setTried(true)} className="inline-flex h-[50px] items-center bg-lime px-[38px] text-[15px] font-bold uppercase tracking-[1px] text-royal hover:bg-[#b8e600]">
              Add to cart
            </button>
          ) : (
            <Link href={`/account?next=cart&sku=${encodeURIComponent(variant?.sku ?? "")}`} className="inline-flex h-[50px] items-center bg-lime px-[38px] text-[15px] font-bold uppercase tracking-[1px] text-royal hover:bg-[#b8e600]">
              Add to cart
            </Link>
          )}
          <Link href="/wishlist" className="inline-flex h-[50px] items-center border border-line px-[22px] text-[14px] uppercase tracking-[1px] text-ink hover:border-ink">
            Add to wishlist
          </Link>
        </div>
        <p className="mt-[14px] text-[14px] leading-[21px] text-body">You’ll need an account to place an order. Card payment (Visa or Mastercard) is taken on the payment provider’s secure page.</p>
        {children}
      </div>
    </div>
  );
}
