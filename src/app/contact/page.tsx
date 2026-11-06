import type { Metadata } from "next";
import { PolicyView } from "@/components/policy/PolicyView";
import { getPolicy } from "@/content/policies";

export function generateMetadata(): Metadata {
  const p = getPolicy("contact")!;
  return { title: p.title, description: p.summary };
}

export default function Page() {
  const policy = getPolicy("contact")!;
  return <PolicyView policy={policy} crumbs={[{ href: "/contact", label: policy.title }]} />;
}
