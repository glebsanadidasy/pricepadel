import type { Metadata } from "next";
import { StubPage } from "@/components/layout/StubPage";

export const metadata: Metadata = { title: "About Us" };

export default function Page() {
  return <StubPage title="About Us" crumbs={[{ href: "/about", label: "About Us" }]}></StubPage>;
}
