import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StubPage } from "@/components/layout/StubPage";
import { POLICY_PAGES } from "@/config/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return POLICY_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = POLICY_PAGES.find((p) => p.slug === slug);
  return page ? { title: page.label } : {};
}

export default async function PolicyPage({ params }: Props) {
  const { slug } = await params;
  const page = POLICY_PAGES.find((p) => p.slug === slug);
  if (!page) notFound();
  return <StubPage title={page.label} crumbs={[{ href: `/policies/${page.slug}`, label: page.label }]} />;
}
