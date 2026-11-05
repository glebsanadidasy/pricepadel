import Image from "next/image";
import { LimeButton, SectionHeading } from "@/components/ui/Button";

const ROWS = [
  {
    title: ["Find your", "perfect racket"],
    body: [
      "The right padel racket can completely transform your game. Whether you play for control from the back of the court, prefer an aggressive attacking style at the net, or you’re somewhere in between — there’s a racket built exactly for how you play.",
      "We stock rackets from the world’s leading brands — Adidas, HEAD, Bullpadel, Wilson, Babolat, Nox and more. From entry-level rackets for beginners to pro-spec carbon models.",
    ],
    cta: { href: "/shop?category=rackets", label: "Shop rackets →" },
    image: { src: "/images/home/section-rackets.png", alt: "Two padel rackets", w: 600, h: 504 },
    imageLeft: true,
    mobileImageFirst: true,
  },
  {
    title: ["Built for", "the court"],
    body: [
      "Padel is one of the most physically demanding racket sports — explosive lateral movement, sudden stops, fast direction changes. Regular trainers simply aren’t built for it. Proper padel shoes give you the grip, ankle support and cushioning you need to move confidently on every surface.",
      "We carry shoes from Adidas, HEAD, Bullpadel, Babolat and K-Swiss — in men’s, women’s and junior sizes. Whether you play on artificial grass, concrete or indoor courts, we have the right pair to keep you moving at your best.",
    ],
    cta: { href: "/shop?category=shoes", label: "Shop shoes →" },
    image: { src: "/images/home/section-shoes.png", alt: "Pair of padel shoes", w: 622, h: 522 },
    imageLeft: false,
    mobileImageFirst: false,
  },
  {
    title: ["Carry it", "all in style"],
    body: [
      "A good padel bag does more than just carry your racket. It keeps your gear organised, your rackets protected and your kit ready to go whenever you are. Whether you need a slim backpack for a single racket and a change of clothes, or a full tour bag that holds everything for a weekend of matches — we have the right option for you.",
      "Our bags range from everyday backpacks to premium tournament bags from Babolat, HEAD, Adidas, Nox and Bullpadel — because your gear deserves proper protection.",
    ],
    cta: { href: "/shop?category=bags", label: "Shop bags →" },
    image: { src: "/images/home/section-bags.png", alt: "Two padel bags", w: 600, h: 504 },
    imageLeft: true,
    mobileImageFirst: false,
  },
];

/** Rackets, shoes and bags rows (Figma 3:129). Image and text alternate sides; the shoes row is right-aligned. */
export function FeatureRows() {
  return (
    <section aria-label="Rackets, shoes and bags" className="mx-auto flex max-w-[1274px] flex-col gap-[80px] px-[15px] py-[60px] lg:gap-[28px] lg:px-0 lg:py-[60px]">
      {ROWS.map((r) => (
        <div key={r.title.join(" ")} className={`flex gap-[40px] lg:grid lg:items-center lg:gap-[55px] ${r.mobileImageFirst ? "flex-col" : "flex-col-reverse"} ${r.imageLeft ? "lg:grid-cols-[622px_1fr]" : "lg:grid-cols-[1fr_622px]"}`}>
          <div className={r.imageLeft ? "lg:order-1" : "lg:order-2"}>
            <Image src={r.image.src} alt={r.image.alt} width={r.image.w} height={r.image.h} sizes="(min-width: 1024px) 622px, 100vw" className="h-auto w-full lg:h-[522px] lg:w-[622px] lg:object-contain" />
          </div>
          <div className={`max-w-[600px] ${r.imageLeft ? "lg:order-2" : "ml-auto text-right lg:order-1"}`}>
            <SectionHeading>
              {r.title[0]}
              <br />
              {r.title[1]}
            </SectionHeading>
            {r.body.map((p) => (
              <p key={p.slice(0, 20)} className="mt-[18px] text-[16px] leading-[26px] text-body first-of-type:mt-[20px]">
                {p}
              </p>
            ))}
            <LimeButton href={r.cta.href} className="mt-[26px]">
              {r.cta.label}
            </LimeButton>
          </div>
        </div>
      ))}
    </section>
  );
}
