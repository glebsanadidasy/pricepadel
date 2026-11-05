"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

const SLIDES = [
  {
    title: "Move faster",
    text: "Padel shoes built for explosive movement, sharp turns and total court confidence.",
    cta: { href: "/shop?category=shoes", label: "Shop shoes" },
    bg: "/images/home/hero-1.jpg",
    product: { src: "/images/home/hero-1-shoe.png", alt: "Padel shoe" },
  },
  {
    title: "Play harder",
    text: "Adidas, Head, Bullpadel, Wilson and more. Padel rackets handpicked for every level and playing style.",
    cta: { href: "/shop?category=rackets", label: "Shop all rackets" },
    bg: "/images/home/hero-2.jpg",
    product: { src: "/images/home/hero-2-racket.png", alt: "Padel racket" },
  },
];

const INTERVAL = 7000;

/** Hero slider (Figma 3:4 "MOVE FASTER" and 19:11 "PLAY HARDER"). Blue overlay at 90%, product image over the headline. */
export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = useCallback((d: number) => setIndex((i) => (i + d + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => go(1), INTERVAL);
    return () => clearTimeout(t);
  }, [index, paused, go]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className="on-dark relative h-[780px] overflow-hidden bg-hero text-white lg:h-[min(1085px,max(720px,56.5vw))]"
    >
      {SLIDES.map((s, i) => (
        <div
          key={s.title}
          role="group"
          aria-roledescription="slide"
          aria-label={`${i + 1} of ${SLIDES.length}`}
          aria-hidden={i !== index}
          inert={i !== index}
          className={`absolute inset-0 transition-opacity duration-700 ${i === index ? "opacity-100" : "opacity-0"}`}
        >
          <Image src={s.bg} alt="" fill preload={i === 0} sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-hero/90" />
          <div className="absolute inset-x-0 top-[330px] flex flex-col items-center px-[25px] text-center lg:top-[min(472px,43.5%)]">
            <div className="relative flex items-center justify-center">
              <h2 className="relative text-[48px] font-black uppercase leading-none lg:text-[clamp(72px,8.75vw,168px)]">{s.title}</h2>
              <Image
                src={s.product.src}
                alt={s.product.alt}
                width={315}
                height={315}
                preload={i === 0}
                className={`pointer-events-none absolute left-1/2 top-1/2 size-[143px] -translate-x-1/2 -translate-y-[38%] object-contain lg:size-[clamp(180px,16.4vw,315px)] lg:-translate-y-[33%] ${i === index ? "animate-[heroIn_900ms_ease-out_both]" : ""}`}
              />
            </div>
            <p className="mt-[64px] max-w-[344px] text-[14px] leading-[20px] text-[#f4f4f4] lg:mt-[clamp(80px,7vw,128px)] lg:max-w-[560px] lg:text-[18px] lg:leading-[26px]">{s.text}</p>
            <Link
              href={s.cta.href}
              tabIndex={i === index ? 0 : -1}
              className="mt-[19px] inline-flex h-[41px] items-center border-2 border-lime bg-lime px-[30px] text-[16px] font-bold uppercase leading-[17px] text-royal transition-colors hover:border-white hover:bg-white lg:mt-[16px] lg:h-[45px] lg:px-[33px]"
            >
              {s.cta.label}
            </Link>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => go(-1)} aria-label="Previous slide" className="absolute left-[35px] top-1/2 z-10 -translate-y-1/2 p-2 hover:text-lime">
        <Icon name="arrowLeft" size={40} />
      </button>
      <button type="button" onClick={() => go(1)} aria-label="Next slide" className="absolute right-[35px] top-1/2 z-10 -translate-y-1/2 rotate-180 p-2 hover:text-lime">
        <Icon name="arrowLeft" size={40} />
      </button>
    </section>
  );
}
