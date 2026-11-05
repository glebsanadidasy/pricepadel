"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

/** `baked`: the headline and button are part of the picture (temporary slide cut from the mockup render). */
const SLIDES: { title: string; cta: { href: string; label: string }; image: string; baked?: boolean }[] = [
  { title: "Your game starts here", cta: { href: "/shop", label: "Shop all" }, image: "/images/home/court-1.jpg", baked: true },
  { title: "Never run out of balls", cta: { href: "/shop?category=balls", label: "Shop balls" }, image: "/images/home/court-2.jpg" },
  { title: "Find your next racket", cta: { href: "/shop?category=rackets", label: "Shop rackets" }, image: "/images/home/hero-2.jpg" },
];

/** "Made for the court" carousel (Figma 3:179): centre slide in colour, neighbours peek in greyscale. */
export function CourtCarousel() {
  const [i, setI] = useState(0);
  const n = SLIDES.length;
  const at = (d: number) => SLIDES[(i + d + n) % n];
  return (
    <section aria-labelledby="court-title" className="section-fade pb-[60px] pt-[70px]">
      <div className="mx-auto max-w-[740px] px-[15px] text-center">
        <h2 id="court-title" className="text-[34px] font-black uppercase leading-[1.1] text-ink md:text-[44px]">
          Made for the court
        </h2>
        <p className="mx-auto mt-[22px] max-w-[580px] text-[16px] leading-[26px]">
          Padel is more than a sport — it’s a community. From your very first game to competing at the highest level, the right gear makes every moment on court better. That’s why we bring together gear for players at every level.
        </p>
      </div>
      <div aria-roledescription="carousel" aria-label="Made for the court" className="relative mt-[40px] h-[585px] overflow-hidden lg:h-[680px]">
        {[-1, 1].map((d) => (
          <div key={d} aria-hidden="true" className={`absolute top-0 hidden h-full w-[1170px] lg:block ${d < 0 ? "right-[calc(50%+600px)]" : "left-[calc(50%+600px)]"}`}>
            <Image src={at(d).image} alt="" fill sizes="1170px" className="object-cover opacity-60 grayscale" />
          </div>
        ))}
        <div className="on-dark absolute inset-y-0 left-1/2 w-full max-w-[1170px] -translate-x-1/2 text-white">
          {SLIDES.map((s, k) => (
            <div key={s.title} aria-hidden={k !== i} inert={k !== i} className={`absolute inset-0 transition-opacity duration-500 ${k === i ? "opacity-100" : "opacity-0"}`}>
              <Image src={s.image} alt="" fill sizes="(min-width: 1170px) 1170px, 100vw" className="object-cover" />
              {s.baked ? (
                <Link href={s.cta.href} tabIndex={k === i ? 0 : -1} className="absolute inset-0">
                  <span className="sr-only">
                    {s.title} — {s.cta.label}
                  </span>
                </Link>
              ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-[36px] bg-black/15 px-[12px] text-center">
                <p className="text-[18px] font-bold uppercase leading-[22px] lg:text-[36px] lg:leading-[40px]">{s.title}</p>
                <Link href={s.cta.href} tabIndex={k === i ? 0 : -1} className="inline-flex h-[41px] w-[200px] items-center justify-center bg-lime text-[16px] font-bold uppercase text-royal hover:bg-white lg:h-[47px]">
                  {s.cta.label}
                </Link>
              </div>
              )}
            </div>
          ))}
          <button type="button" onClick={() => setI((i - 1 + n) % n)} aria-label="Previous slide" className="absolute left-[20px] top-1/2 -translate-y-1/2 p-2 hover:text-lime">
            <Icon name="arrowLeft" size={32} />
          </button>
          <button type="button" onClick={() => setI((i + 1) % n)} aria-label="Next slide" className="absolute right-[20px] top-1/2 -translate-y-1/2 rotate-180 p-2 hover:text-lime">
            <Icon name="arrowLeft" size={32} />
          </button>
        </div>
      </div>
    </section>
  );
}
