import type { Metadata } from "next";
import { ProfileForm } from "@/components/account/AccountForms";
import { Notice, SubmitButton } from "@/components/ui/Form";
import { requireUser } from "@/lib/auth";
import { resendVerification } from "../actions";

export const metadata: Metadata = { title: "My Account" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser("/account");
  const q = await searchParams;
  return (
    <div className="max-w-[560px] space-y-[28px]">
      {q.welcome && <Notice kind="ok">Your account is ready. We’ve sent a confirmation link to {user.email}.</Notice>}
      {q.verified && <Notice kind="ok">Thank you — your e-mail is confirmed.</Notice>}
      {q.mail === "sent" && <Notice kind="ok">We’ve sent a new confirmation link.</Notice>}
      {q.mail === "limit" && <Notice kind="error">Too many links sent. Please try again later.</Notice>}
      <section>
        <h2 className="text-[18px] font-bold text-ink">E-mail</h2>
        <p className="mt-[6px] text-[15px] text-ink">{user.email}</p>
        {user.email_verified_at ? (
          <p className="mt-[4px] text-[14px] text-[#2e7d32]">Confirmed</p>
        ) : (
          <div className="mt-[8px] space-y-[10px]">
            <Notice>Please confirm your e-mail to place orders — check your inbox for our link.</Notice>
            <form action={resendVerification}>
              <SubmitButton variant="plain">Send the link again</SubmitButton>
            </form>
          </div>
        )}
      </section>
      <section>
        <h2 className="text-[18px] font-bold text-ink">Profile</h2>
        <div className="mt-[10px]">
          <ProfileForm name={user.name} />
        </div>
      </section>
      {user.deletion_requested_at && <Notice>You asked us to delete this account on {user.deletion_requested_at.slice(0, 10)}. We’ll confirm by e-mail.</Notice>}
    </div>
  );
}
