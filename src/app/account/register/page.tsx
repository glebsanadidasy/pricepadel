import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/account/AccountForms";
import { PageHero } from "@/components/layout/PageHero";
import { currentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Create an account" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await currentUser()) redirect("/account");
  const next = (await searchParams).next ?? "/account";
  return (
    <>
      <PageHero title="Create an account" crumbs={[{ href: "/account", label: "My Account" }]} />
      <div className="mx-auto max-w-[460px] px-[15px] pb-[80px] pt-[40px]">
        <RegisterForm next={next.startsWith("/") && !next.startsWith("//") ? next : "/account"} />
      </div>
    </>
  );
}
