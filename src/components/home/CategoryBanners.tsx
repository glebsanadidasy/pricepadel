import Image from "next/image";
import Link from "next/link";

const BANNERS = [
  {
    eyebrow: "Padel shoes",
    title: "Choose the best",
    text: "Grip, agility and comfort - built for every surface and every player.",
    cta: { href: "/shop?category=shoes", label: "Shop shoes" },
    image: "/images/home/banner-shoes.png",
  },
  {
    eyebrow: "Choose the best",
    title: "Padel rackets",
    text: "From beginner to pro — find the perfect racket for your playing style and level.",
    cta: { href: "/shop?category=rackets", label: "Shop rackets" },
    image: "/images/home/banner-rackets.png",
  },
  {
    eyebrow: "Choose the best",
    title: "Padel accessories",
    text: "Overgrips, balls and more — the small details that make a big difference.",
    cta: { href: "/shop?category=accessories", label: "Shop accessories" },
    image: "/images/home/banner-accessories.png",
  },
];

/** Three banners under the hero (Figma 19:870). Backgrounds and product art are one image each. */
export function CategoryBanners() {
  return (
    <section aria-label="Shop by category" className="on-dark grid text-white lg:grid-cols-3">
      {BANNERS.map((b) => (
        <div key={b.title} className="relative aspect-[390/182] overflow-hidden lg:aspect-[640/299]">
          <Image src={b.image} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
          {/* Phones: centred text block (Figma 19:518); desktop: left column (19:895). */}
          <div className="relative flex h-full flex-col items-center justify-center text-center lg:w-[66%] lg:items-start lg:justify-center lg:pl-[7.6%] lg:text-left">
            <p className="text-[12px] font-bold uppercase leading-[16px] tracking-[2px] text-lime lg:text-[13px]">{b.eyebrow}</p>
            <h2 className="mt-[8px] text-[22px] font-bold uppercase leading-[27px] lg:mt-[10px] lg:text-[clamp(22px,1.75vw,34px)] lg:leading-[1.2]">{b.title}</h2>
            <p className="mt-[13px] hidden max-w-[300px] text-[16px] leading-[24px] lg:block">{b.text}</p>
            <Link
              href={b.cta.href}
              className="mt-[17px] inline-flex h-[30px] items-center rounded-full border border-white px-[27px] text-[11px] font-bold uppercase tracking-[1px] transition-colors hover:bg-white hover:text-royal lg:mt-[22px] lg:h-[44px] lg:text-[12px]"
            >
              {b.cta.label}
            </Link>
          </div>
        </div>
      ))}
    </section>
  );
}
