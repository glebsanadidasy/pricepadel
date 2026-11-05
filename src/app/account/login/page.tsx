import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/account/AccountForms";
import { PageHero } from "@/components/layout/PageHero";
import { currentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = (await searchParams).next ?? "/account";
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  if (await currentUser()) redirect(safe);
  return (
    <>
      <PageHero title="Sign in" crumbs={[{ href: "/account", label: "My Account" }]} />
      <div className="mx-auto max-w-[460px] px-[15px] pb-[80px] pt-[40px]">
        <LoginForm next={safe} />
      </div>
    </>
  );
}
