import { PageHero } from "./PageHero";
import { LimeButton } from "@/components/ui/Button";

/** Placeholder for pages that come in later stages. No texts, policies or articles are written yet. */
export function StubPage({ title, crumbs, children }: { title: string; crumbs?: { href: string; label: string }[]; children?: React.ReactNode }) {
  return (
    <>
      <PageHero title={title} crumbs={crumbs} />
      <div className="mx-auto max-w-site px-[15px] py-[70px] lg:px-0">
        <p className="text-[18px] leading-[28px] text-ink">This page is being prepared.</p>
        {children && <div className="mt-[20px] text-[16px] leading-[26px]">{children}</div>}
        <LimeButton href="/shop" className="mt-[34px]">
          Go to the shop
        </LimeButton>
      </div>
    </>
  );
}
