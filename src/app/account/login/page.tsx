import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/account/AccountForms";
import { PageHero } from "@/components/layout/PageHero";
import { Notice } from "@/components/ui/Form";
import { currentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const q = await searchParams;
  const next = q.next ?? "/account";
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  if (await currentUser()) redirect(safe);
  return (
    <>
      <PageHero title="Sign in" crumbs={[{ href: "/account", label: "My Account" }]} />
      <div className="mx-auto max-w-[460px] space-y-[16px] px-[15px] pb-[80px] pt-[40px]">
        {q.reset && <Notice kind="ok">Your password has been changed. Please sign in.</Notice>}
        <LoginForm next={safe} />
      </div>
    </>
  );
}
