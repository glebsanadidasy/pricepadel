import type { Metadata } from "next";
import { StubPage } from "@/components/layout/StubPage";

export const metadata: Metadata = { title: "Cart" };

export default function Page() {
  return <StubPage title="Cart" crumbs={[{ href: "/cart", label: "Cart" }]}><p>Your cart is empty. You’ll need an account to place an order.</p></StubPage>;
}
