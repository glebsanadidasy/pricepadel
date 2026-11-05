import type { Metadata } from "next";
import { StubPage } from "@/components/layout/StubPage";
import { BUSINESS } from "@/config/site";
export const metadata: Metadata = { title: "Partnerships" };

export default function Page() {
  return <StubPage title="Partnerships" crumbs={[{ href: "/partnerships", label: "Partnerships" }]}><p>For partnerships, write to <a className="text-royal underline" href={`mailto:${BUSINESS.partnersEmail}`}>{BUSINESS.partnersEmail}</a>.</p></StubPage>;
}
