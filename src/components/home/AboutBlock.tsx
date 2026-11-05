import Image from "next/image";
import { LimeButton } from "@/components/ui/Button";

/**
 * "Everything you need. Nothing you don't." (Figma 3:330).
 * The counters only show real catalogue figures; with no live products yet they stay hidden.
 */
export function AboutBlock({ stats }: { stats: { rackets: number; brands: number } }) {
  const counters = [
    stats.rackets > 0 && { value: `${stats.rackets}`, label: "Rackets in the catalogue" },
    stats.brands > 0 && { value: `${stats.brands}`, label: "Brands" },
  ].filter(Boolean) as { value: string; label: string }[];

  return (
    <section aria-labelledby="about-title" className="section-fade">
      <div className="mx-auto grid max-w-[1150px] items-center gap-[40px] px-[15px] py-[60px] lg:grid-cols-[400px_1fr] lg:gap-[65px] lg:px-0 lg:py-[80px]">
        <Image src="/images/home/about.png" alt="Padel player hitting a forehand" width={600} height={647} sizes="(min-width: 1024px) 400px, 100vw" className="mx-auto h-auto w-full max-w-[400px]" />
        <div className="max-w-[690px]">
          <p className="text-[12px] font-bold uppercase leading-[15px] tracking-[3px] text-royal">Premium padel. Fair price.</p>
          <h2 id="about-title" className="mt-[12px] text-[34px] font-bold leading-[1.15] text-slate lg:text-[40px] lg:leading-[46px]">
            Everything you need.
            <br />
            Nothing you don’t.
          </h2>
          <p className="mt-[16px] text-[16px] leading-[29px]">
            We started Price Padel with one simple idea — premium padel gear shouldn’t cost a fortune. Whether you’re picking up a racket for the first time or you’ve been playing for years, you deserve access to the best equipment at a fair price.
          </p>
          <p className="mt-[8px] text-[16px] leading-[29px]">From Adidas and HEAD to Bullpadel, Wilson and Babolat — we carry the full range, with honest advice on every order.</p>
          {counters.length > 0 && (
            <dl className="mt-[28px] flex flex-wrap gap-x-[48px] gap-y-[20px]">
              {counters.map((c) => (
                <div key={c.label} className="flex flex-col-reverse">
                  <dt className="mt-[6px] text-[12px] uppercase tracking-[2px] text-[#888]">{c.label}</dt>
                  <dd className="text-[34px] font-bold leading-[39px] text-royal">{c.value}</dd>
                </div>
              ))}
            </dl>
          )}
          <LimeButton href="/shop" className="mt-[32px]">
            Shop now →
          </LimeButton>
        </div>
      </div>
    </section>
  );
}
