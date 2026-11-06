import Link from "next/link";
import { BUSINESS, COMPANY_LINKS, INSTAGRAM_URL, POLICY_PAGES } from "@/config/site";
import { BLOG_POSTS } from "@/data/blog";
import { Icon } from "@/components/ui/Icon";

function Heading({ children }: { children: React.ReactNode }) {
  return <h2 className="border-b border-white/10 pb-[14px] text-[14px] uppercase leading-[16px] text-white">{children}</h2>;
}

/** Footer from Figma 3:446. */
export function Footer() {
  return (
    <footer className="on-dark bg-slate text-white">
      <div className="mx-auto grid max-w-site gap-x-[30px] gap-y-[48px] px-[15px] pb-[48px] pt-[60px] md:grid-cols-2 lg:grid-cols-[294px_404px_358px] lg:justify-between lg:px-0 lg:pt-[58px]">
        <div className="text-[16px] leading-[25px]">
          <Link href="/" aria-label={`${BUSINESS.name} — home`} className="inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/brand/logo.svg" alt="Price Padel" width={124} height={58} className="h-[58px] w-[124px]" />
          </Link>
          <p className="mt-[18px]">Your go-to destination for premium padel gear at fair prices. Rackets, shoes, bags and accessories for players across the UK.</p>
          <p className="mt-[40px]">
            {BUSINESS.tradingAs}
            <br />
            Company number: {BUSINESS.companyNumber}
            <br />
            Registered office: {BUSINESS.address}
            <br />
            Email:{" "}
            <a href={`mailto:${BUSINESS.email}`} className="hover:text-lime">
              {BUSINESS.email}
            </a>
            <br />
            Phone:{" "}
            <a href={BUSINESS.phoneHref} className="underline decoration-white/60 underline-offset-[5px] hover:text-lime">
              {BUSINESS.phone}
            </a>
          </p>
          <a href={INSTAGRAM_URL ?? "/contact"} aria-label="Instagram" className="mt-[48px] inline-block hover:text-lime">
            <Icon name="instagram" size={16} />
          </a>
        </div>

        <div>
          <Heading>Useful links</Heading>
          <div className="mt-[23px] grid grid-cols-[180px_1fr] gap-x-[27px] text-[16px] leading-[19px] lg:grid-cols-[180px_1fr]">
            <ul className="space-y-[17px]">
              {POLICY_PAGES.map((p) => (
                <li key={p.slug}>
                  <Link href={`/policies/${p.slug}`} className="hover:text-lime">
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="space-y-[17px]">
              {COMPANY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-lime">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <Heading>Latest posts</Heading>
          <ul className="mt-[28px] space-y-[20px]">
            {BLOG_POSTS.slice(1, 4).map((post) => (
              <li key={post.slug}>
                <Link href={`/blog/${post.slug}`} className="group flex gap-[20px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.thumb} alt="" width={75} height={75} className="size-[75px] shrink-0 object-cover" />
                  <span className="line-clamp-2 pt-[1px] text-[16px] leading-[22px] group-hover:text-lime">{post.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mx-auto flex max-w-site flex-col gap-[24px] px-[15px] pb-[24px] pt-[18px] text-[14px] leading-[19px] md:flex-row md:items-center md:justify-between lg:px-0 lg:pb-[20px]">
        <p>
          Copyright © {new Date().getFullYear()} {BUSINESS.legalName}
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/brand/cards-visa-mastercard.png" alt="We accept Visa and Mastercard" width={126} height={42} className="h-[42px] w-[126px]" />
      </div>
    </footer>
  );
}
