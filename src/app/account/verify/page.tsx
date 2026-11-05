import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { LimeButton } from "@/components/ui/Button";
import { sha256 } from "@/lib/auth";
import { db, now } from "@/lib/db";

export const metadata: Metadata = { title: "Confirm e-mail", robots: { index: false } };

/** Link from the confirmation e-mail. A token works once and expires after 48 hours. */
export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token ?? "";
  const row = token
    ? (db().prepare("SELECT user_id, expires_at, used_at FROM email_tokens WHERE token_hash = ? AND purpose = 'verify'").get(sha256(token)) as
        | { user_id: number; expires_at: string; used_at: string | null }
        | undefined)
    : undefined;
  const ok = !!row && !row.used_at && row.expires_at > now();
  if (ok) {
    db().prepare("UPDATE email_tokens SET used_at = ? WHERE token_hash = ?").run(now(), sha256(token));
    db().prepare("UPDATE users SET email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?").run(now(), row.user_id);
  }
  return (
    <>
      <PageHero title="Confirm e-mail" crumbs={[{ href: "/account", label: "My Account" }]} />
      <div className="mx-auto max-w-site px-[15px] pb-[80px] pt-[40px] lg:px-0">
        <p className="text-[18px] text-ink">{ok ? "Thank you — your e-mail is confirmed. You can now place orders." : "This link is invalid or has expired. Sign in and ask for a new one on your account page."}</p>
        <LimeButton href={ok ? "/shop" : "/account"} className="mt-[24px]">
          {ok ? "Go to the shop" : "My account"}
        </LimeButton>
      </div>
    </>
  );
}
