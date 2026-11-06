import type { Metadata } from "next";
import { PolicyView } from "@/components/policy/PolicyView";
import { getPolicy } from "@/content/policies";

export function generateMetadata(): Metadata {
  const p = getPolicy("about")!;
  return { title: p.title, description: p.summary };
}

export default function Page() {
  const policy = getPolicy("about")!;
  return <PolicyView policy={policy} crumbs={[{ href: "/about", label: policy.title }]} />;
}
