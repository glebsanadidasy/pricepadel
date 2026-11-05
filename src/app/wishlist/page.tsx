import type { Metadata } from "next";
import Link from "next/link";
import { toggleWishlist } from "@/app/account/actions";
import { PageHero } from "@/components/layout/PageHero";
import { ProductCard, toCard } from "@/components/shop/ProductCard";
import { LimeButton } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/Form";
import { currentUser } from "@/lib/auth";
import { getProductById } from "@/lib/catalog";
import { getMoney } from "@/lib/currency";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const user = await currentUser();
  const money = await getMoney();
  const ids = user ? (db().prepare("SELECT product_id FROM wishlist WHERE user_id = ? ORDER BY created_at DESC").all(user.id) as { product_id: string }[]) : [];
  const products = ids.map((r) => ({ id: r.product_id, product: getProductById(r.product_id) }));

  return (
    <>
      <PageHero title="Wishlist" crumbs={[{ href: "/wishlist", label: "Wishlist" }]} />
      <div className="mx-auto max-w-site px-[15px] pb-[80px] pt-[40px] lg:px-0">
        {!user ? (
          <div>
            <p className="text-[18px] text-ink">Sign in to save products to your wishlist.</p>
            <LimeButton href="/account/login?next=/wishlist" className="mt-[24px]">
              Sign in
            </LimeButton>
          </div>
        ) : products.length === 0 ? (
          <p className="text-[18px] text-ink">
            Your wishlist is empty.{" "}
            <Link href="/shop" className="text-royal underline">
              Browse the shop
            </Link>
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-x-[20px] gap-y-[40px] lg:grid-cols-4 lg:gap-x-[34px]">
            {products.map(({ id, product }) => (
              <li key={id} className="flex flex-col items-center">
                {product ? <ProductCard product={toCard(product, money.format(product.price))} /> : <p className="text-[15px]">This product is no longer available.</p>}
                <form action={toggleWishlist.bind(null, id, "/wishlist")} className="mt-[10px]">
                  <SubmitButton variant="plain" className="h-[36px]">
                    Remove
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
