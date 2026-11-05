import type { Metadata } from "next";
import { StubPage } from "@/components/layout/StubPage";
import { BUSINESS } from "@/config/site";
export const metadata: Metadata = { title: "Contact" };

export default function Page() {
  return <StubPage title="Contact" crumbs={[{ href: "/contact", label: "Contact" }]}><p>Orders and support: <a className="text-royal underline" href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a><br />Phone: <a className="text-royal underline" href={BUSINESS.phoneHref}>{BUSINESS.phone}</a><br />{BUSINESS.hours}</p></StubPage>;
}
