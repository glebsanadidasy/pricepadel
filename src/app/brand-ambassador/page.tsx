import type { Metadata } from "next";
import { StubPage } from "@/components/layout/StubPage";

export const metadata: Metadata = { title: "Brand Ambassador" };

export default function Page() {
  return <StubPage title="Brand Ambassador" crumbs={[{ href: "/brand-ambassador", label: "Brand Ambassador" }]}></StubPage>;
}
