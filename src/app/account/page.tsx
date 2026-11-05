import type { Metadata } from "next";
import { StubPage } from "@/components/layout/StubPage";

export const metadata: Metadata = { title: "My Account" };

export default function Page() {
  return <StubPage title="My Account" crumbs={[{ href: "/account", label: "My Account" }]}><p>Registration and sign-in arrive in the next stage. An account is required before placing an order.</p></StubPage>;
}
