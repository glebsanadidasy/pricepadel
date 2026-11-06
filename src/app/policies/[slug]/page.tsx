import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PolicyView } from "@/components/policy/PolicyView";
import { POLICY_PAGES } from "@/config/site";
import { getPolicy } from "@/content/policies";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = POLICY_PAGES.some((x) => x.slug === slug) ? getPolicy(slug) : undefined;
  return p ? { title: p.title, description: p.summary } : {};
}

export default async function PolicyPage({ params }: Props) {
  const { slug } = await params;
  const policy = POLICY_PAGES.some((p) => p.slug === slug) ? getPolicy(slug) : undefined;
  if (!policy) notFound();
  return <PolicyView policy={policy} crumbs={[{ href: `/policies/${slug}`, label: policy.title }]} />;
}
