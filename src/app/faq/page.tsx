import type { Metadata } from "next";
import { StubPage } from "@/components/layout/StubPage";

export const metadata: Metadata = { title: "FAQ" };

export default function Page() {
  return <StubPage title="FAQ" crumbs={[{ href: "/faq", label: "FAQ" }]}></StubPage>;
}
