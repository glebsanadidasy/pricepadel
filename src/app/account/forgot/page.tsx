import type { Metadata } from "next";
import { ForgotForm } from "@/components/account/AccountForms";
import { PageHero } from "@/components/layout/PageHero";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };

export default function ForgotPage() {
  return (
    <>
      <PageHero title="Reset password" crumbs={[{ href: "/account", label: "My Account" }]} />
      <div className="mx-auto max-w-[460px] space-y-[16px] px-[15px] pb-[80px] pt-[40px]">
        <p className="text-[15px]">Enter the e-mail of your account. We’ll send you a link to choose a new password.</p>
        <ForgotForm />
      </div>
    </>
  );
}
