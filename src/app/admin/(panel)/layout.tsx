import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { adminLogout } from "../actions";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin" }, robots: { index: false, follow: false } };

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/settings", label: "Prices & settings" },
];

/** Every admin page checks the admin session itself too; this layout adds the menu. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-[1400px] px-[15px] pb-[80px] pt-[30px]">
      <div className="flex flex-wrap items-center gap-x-[24px] gap-y-[8px] border-b border-line pb-[14px]">
        <p className="text-[20px] font-black uppercase text-ink">Admin</p>
        <nav aria-label="Admin" className="flex flex-wrap gap-x-[18px] gap-y-[6px] text-[15px]">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-royal hover:underline">
              {n.label}
            </Link>
          ))}
        </nav>
        <form action={adminLogout} className="sm:ml-auto">
          <button type="submit" className="text-[14px] text-royal hover:underline">
            Sign out
          </button>
        </form>
      </div>
      {children}
    </div>
  );
}
