import type { Metadata } from "next";
import { PolicyView } from "@/components/policy/PolicyView";
import { DataComplaintForm } from "@/components/contact/DataComplaintForm";
import { getPolicy } from "@/content/policies";

export function generateMetadata(): Metadata {
  const p = getPolicy("contact")!;
  return { title: p.title, description: p.summary };
}

export default function Page() {
  const policy = getPolicy("contact")!;
  return (
    <PolicyView policy={policy} crumbs={[{ href: "/contact", label: policy.title }]}>
      <section id="data-complaint" className="scroll-mt-[20px] space-y-[12px] pt-[14px]">
        <h2 className="text-[22px] font-bold leading-[28px] text-ink">Data protection complaint form</h2>
        <p>
          Unhappy with how we use your personal data? Tell us here — no account needed — or e-mail us. We confirm receipt within 2 working days and give a full answer
          within 14 days. You can also complain to the Information Commissioner’s Office at any time.
        </p>
        <DataComplaintForm />
      </section>
    </PolicyView>
  );
}
