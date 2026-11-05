import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin" }, robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  requireAdmin();
  return (
    <div className="mx-auto max-w-[1400px] px-[15px] pb-[80px] pt-[30px]">
      <div className="flex flex-wrap items-center gap-x-[24px] gap-y-[8px] border-b border-line pb-[14px]">
        <p className="text-[20px] font-black uppercase text-ink">Admin</p>
        <nav aria-label="Admin" className="flex gap-[18px] text-[15px]">
          <Link href="/admin" className="text-royal hover:underline">
            Overview
          </Link>
          <Link href="/admin/products" className="text-royal hover:underline">
            Products
          </Link>
        </nav>
        <p className="text-[13px] text-[#888] sm:ml-auto">Local preview only — sign-in comes with customer accounts.</p>
      </div>
      {children}
    </div>
  );
}
