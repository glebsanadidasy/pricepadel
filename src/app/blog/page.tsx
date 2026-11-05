import type { Metadata } from "next";
import { StubPage } from "@/components/layout/StubPage";

export const metadata: Metadata = { title: "Blog" };

export default function Page() {
  return <StubPage title="Blog" crumbs={[{ href: "/blog", label: "Blog" }]}></StubPage>;
}
