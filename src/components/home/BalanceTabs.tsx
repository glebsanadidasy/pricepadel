"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/Button";

const TABS = [
  {
    key: "high",
    word: "High",
    tag: "Attack",
    text: "Weight is concentrated in the head of the racket, generating more momentum and power on smashes, volleys and overhead shots. Best for aggressive players who like to dominate the game.",
    tile: "bg-lime",
    ball: "top-[-6px]",
    tilt: "rotate-0",
  },
  {
    key: "mid",
    word: "Mid",
    tag: "All-round",
    text: "Weight is evenly distributed through the centre of the racket, offering the ideal balance of power, control and maneuverability. The most versatile option for all playing styles.",
    tile: "bg-steel",
    ball: "top-[18px]",
    tilt: "-rotate-[4deg]",
  },
  {
    key: "low",
    word: "Low",
    tag: "Control",
    text: "Weight is positioned closer to the handle, making the racket quicker to swing and easier to control. Ideal for fast reactions, precision shots and defensive play.",
    tile: "bg-graphite",
    ball: "top-[42px]",
    tilt: "-rotate-[7deg]",
  },
] as const;

function Ball({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 40 40" className={`absolute left-1/2 size-[38px] -translate-x-1/2 ${className}`}>
      <circle cx="20" cy="20" r="18" fill="#d7f20a" stroke="#2f3e46" strokeWidth="1.6" />
      <path d="M6 9c6 4 8 9 8 13s-2 9-6 11M34 9c-6 4-8 9-8 13s2 9 6 11" fill="none" stroke="#2f3e46" strokeWidth="1.6" />
    </svg>
  );
}

/** "What is racket balance?" with High / Mid / Low tabs (Figma 3:155 and the 19:1194 / 19:1275 / 19:1359 states). */
export function BalanceTabs() {
  const [active, setActive] = useState(0);
  const tab = TABS[active];
  return (
    <section aria-labelledby="balance-title" className="section-fade">
      <div className="mx-auto grid max-w-[1298px] gap-[40px] px-[15px] pb-[70px] pt-[77px] lg:grid-cols-[580px_1fr] lg:gap-[60px] lg:px-0 lg:pl-[11px]">
        <div>
          <SectionHeading>
            <span id="balance-title">
              What is racket
              <br />
              balance?
            </span>
          </SectionHeading>
          <p className="mt-[30px] max-w-[580px] text-[16px] leading-[26px]">
            Balance is one of the most important factors when choosing a padel racket. It determines where the weight is distributed — and that changes everything about how the racket feels and plays.
          </p>
          <div role="tablist" aria-label="Racket balance" className="mt-[46px] flex flex-col gap-[28px]">
            {TABS.map((t, i) => {
              const on = i === active;
              return (
                <button
                  key={t.key}
                  id={`balance-tab-${t.key}`}
                  role="tab"
                  type="button"
                  aria-selected={on}
                  aria-controls="balance-panel"
                  onClick={() => setActive(i)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                      e.preventDefault();
                      const next = (i + (e.key === "ArrowDown" ? 1 : -1) + TABS.length) % TABS.length;
                      setActive(next);
                      document.getElementById(`balance-tab-${TABS[next].key}`)?.focus();
                    }
                  }}
                  tabIndex={on ? 0 : -1}
                  className="group grid grid-cols-[72px_1fr_auto] gap-x-[24px] text-left"
                >
                  <span className={`relative size-[72px] overflow-hidden rounded-[8px] ${t.tile}`}>
                    <Ball className={t.ball} />
                  </span>
                  <span>
                    <span className="block text-[28px] leading-[34px] text-ink">
                      <strong className="font-black">{t.word}</strong> <span className="font-light">Balance</span>
                    </span>
                    <span className="mt-[2px] block text-[22px] font-bold uppercase leading-[26px] text-lime-ink">{t.tag}</span>
                  </span>
                  <span className={`self-center pr-[10px] text-ink transition-opacity ${on ? "opacity-100" : "opacity-0 group-hover:opacity-60"}`}>
                    <Icon name="arrowRight" size={30} strokeWidth={1.4} />
                  </span>
                  <span className="col-start-2 col-end-4 mt-[20px] max-w-[520px] text-[16px] leading-[26px] text-body">{t.text}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div id="balance-panel" role="tabpanel" aria-labelledby={`balance-tab-${tab.key}`} className="relative flex min-h-[420px] items-center justify-center lg:min-h-[700px] lg:items-start lg:pt-[150px]">
          <span aria-hidden="true" className="absolute bottom-[12%] left-1/2 -translate-x-1/2 select-none text-[120px] font-normal uppercase leading-none text-[#e6e6e6] lg:bottom-auto lg:top-[560px] lg:text-[200px]">
            {tab.word}
          </span>
          <Image
            key={tab.key}
            src="/images/home/balance.png"
            alt={`Padel racket — ${tab.word.toLowerCase()} balance`}
            width={600}
            height={700}
            sizes="(min-width: 1024px) 600px, 90vw"
            className={`relative h-auto w-[min(560px,90vw)] transition-transform duration-500 ${tab.tilt}`}
          />
          <Link href={`/shop?category=rackets`} className="sr-only focus:not-sr-only">
            Shop {tab.word.toLowerCase()} balance rackets
          </Link>
        </div>
      </div>
    </section>
  );
}
