import type { Metadata } from "next";
import { ResetForm } from "@/components/account/AccountForms";
import { PageHero } from "@/components/layout/PageHero";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

/** Link from the reset e-mail. The token is checked when the form is sent (it works once, for 1 hour). */
export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token ?? "";
  return (
    <>
      <PageHero title="Choose a new password" crumbs={[{ href: "/account", label: "My Account" }]} />
      <div className="mx-auto max-w-[460px] px-[15px] pb-[80px] pt-[40px]">
        <ResetForm token={token} />
      </div>
    </>
  );
}
