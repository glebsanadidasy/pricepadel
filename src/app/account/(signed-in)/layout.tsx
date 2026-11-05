import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { requireUser } from "@/lib/auth";
import { logout } from "../actions";

const NAV = [
  { href: "/account", label: "Profile" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/account/delete", label: "Delete account" },
];

/** Every page in here belongs to the signed-in customer and shows only their own data. */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/account");
  return (
    <>
      <PageHero title="My Account" crumbs={[{ href: "/account", label: "My Account" }]} />
      <div className="mx-auto grid max-w-site gap-[30px] px-[15px] pb-[80px] pt-[36px] lg:grid-cols-[220px_1fr] lg:px-0">
        <nav aria-label="Account" className="text-[15px]">
          <p className="mb-[10px] truncate text-[13px] text-[#888]">{user.email}</p>
          <ul className="flex flex-wrap gap-x-[18px] gap-y-[8px] lg:block lg:space-y-[10px]">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="text-royal hover:underline">
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <form action={logout}>
                <button type="submit" className="text-royal hover:underline">
                  Sign out
                </button>
              </form>
            </li>
          </ul>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </>
  );
}
