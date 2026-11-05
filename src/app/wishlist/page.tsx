import type { Metadata } from "next";
import { StubPage } from "@/components/layout/StubPage";

export const metadata: Metadata = { title: "Wishlist" };

export default function Page() {
  return <StubPage title="Wishlist" crumbs={[{ href: "/wishlist", label: "Wishlist" }]}><p>Sign in to save products to your wishlist.</p></StubPage>;
}
