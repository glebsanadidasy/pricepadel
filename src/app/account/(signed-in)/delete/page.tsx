import type { Metadata } from "next";
import { Notice, SubmitButton } from "@/components/ui/Form";
import { requireUser } from "@/lib/auth";
import { requestDeletion } from "../../actions";

export const metadata: Metadata = { title: "Delete account" };

export default async function DeletePage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const user = await requireUser("/account/delete");
  const sent = (await searchParams).sent;
  return (
    <section className="max-w-[560px] space-y-[14px] text-[15px] leading-[23px]">
      <h2 className="text-[18px] font-bold text-ink">Delete account</h2>
      {sent || user.deletion_requested_at ? (
        <Notice kind="ok">We have your request (sent {user.deletion_requested_at?.slice(0, 10)}). We’ll process it and confirm by e-mail.</Notice>
      ) : (
        <>
          <p>We’ll delete your account and personal data. Records of paid orders are kept only as long as the law requires.</p>
          <form action={requestDeletion} className="space-y-[12px]">
            <label className="flex items-start gap-[10px]">
              <input type="checkbox" name="confirm" value="yes" required className="mt-[5px] size-[16px] accent-royal" />
              <span>Yes, I want my account deleted.</span>
            </label>
            <SubmitButton variant="danger">Request deletion</SubmitButton>
          </form>
        </>
      )}
    </section>
  );
}
