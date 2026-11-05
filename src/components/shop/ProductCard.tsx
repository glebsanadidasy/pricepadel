import Image from "next/image";
import Link from "next/link";
import { CATEGORY_LABELS, type Product } from "@/lib/catalog-types";
import { Icon } from "@/components/ui/Icon";

export type CardProduct = Pick<Product, "slug" | "name" | "category" | "images" | "sizes" | "colours"> & { priceLabel: string };

export function toCard(p: Product, priceLabel: string): CardProduct {
  return { slug: p.slug, name: p.name, category: p.category, images: p.images, sizes: p.sizes, colours: p.colours, priceLabel };
}

export function NoPhoto({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-[#f6f6f6] text-[13px] text-[#999] ${className}`}>
      <span>Photo coming soon</span>
    </div>
  );
}

/** Product tile from the "Best products" slider (Figma 3:244): image, category, name, price, grey button; quick icons on hover. */
export function ProductCard({ product, sizes = "(min-width: 1024px) 255px, 50vw" }: { product: CardProduct; sizes?: string }) {
  const href = `/product/${product.slug}`;
  const hasOptions = product.sizes.length > 0 || product.colours.length > 1;
  const img = product.images[0];
  return (
    <article className="group relative flex flex-col items-center text-center">
      <div className="relative aspect-square w-full">
        <Link href={href} tabIndex={-1} aria-hidden="true" className="absolute inset-0">
          {img ? <Image src={img.src} alt="" fill sizes={sizes} className="object-contain" /> : <NoPhoto className="absolute inset-0" />}
        </Link>
        <div className="absolute right-[-4px] top-1/2 flex -translate-y-1/2 flex-col gap-[22px] opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-lg:hidden">
          <Link href={href} aria-label={`View ${product.name}`} className="text-[#333] hover:text-royal">
            <Icon name="eye" size={17} />
          </Link>
          <Link href={href} aria-label={`Choose options for ${product.name}`} className="text-[#333] hover:text-royal">
            <Icon name="bag" size={16} />
          </Link>
          <Link href="/wishlist" aria-label={`Add ${product.name} to wishlist`} className="text-[#333] hover:text-royal">
            <Icon name="heart" size={16} />
          </Link>
        </div>
      </div>
      <p className="mt-[18px] text-[16px] leading-[19px] text-[#888]">{CATEGORY_LABELS[product.category]}</p>
      <h3 className="mt-[5px] px-[10px] text-[16px] leading-[24px] text-ink">
        <Link href={href} className="hover:text-royal">
          {product.name}
        </Link>
      </h3>
      <p className="mt-[7px] text-[16px] leading-[19px] text-[#888]">{product.priceLabel}</p>
      <Link href={href} className="mt-[17px] inline-flex h-[40px] items-center whitespace-nowrap bg-mist px-[16px] text-[12px] sm:px-[40px] uppercase leading-[13px] text-[#222] transition-colors hover:bg-[#e4e4e4]">
        {hasOptions ? "Select options" : "View product"}
      </Link>
    </article>
  );
}
