import type { Metadata } from "next";
import { StubPage } from "@/components/layout/StubPage";

export const metadata: Metadata = { title: "Affiliate Program" };

export default function Page() {
  return <StubPage title="Affiliate Program" crumbs={[{ href: "/affiliate-program", label: "Affiliate Program" }]}></StubPage>;
}
