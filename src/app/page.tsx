import { HeroSlider } from "@/components/home/HeroSlider";
import { CategoryBanners } from "@/components/home/CategoryBanners";
import { FeatureRows } from "@/components/home/FeatureRows";
import { BalanceTabs } from "@/components/home/BalanceTabs";
import { CourtCarousel } from "@/components/home/CourtCarousel";
import { ProductCarousel } from "@/components/home/ProductCarousel";
import { AboutBlock } from "@/components/home/AboutBlock";
import { BlogCards } from "@/components/home/BlogCards";
import { toCard } from "@/components/shop/ProductCard";
import { catalogueStats, featuredProducts } from "@/lib/catalog";
import { getCurrency } from "@/lib/currency";
import { formatPrice } from "@/config/currency";

export default async function HomePage() {
  const currency = await getCurrency();
  const products = featuredProducts(9).map((p) => toCard(p, formatPrice(p.price, currency)));
  return (
    <>
      <HeroSlider />
      <CategoryBanners />
      <FeatureRows />
      <BalanceTabs />
      <CourtCarousel />
      {products.length > 0 && (
        <section aria-labelledby="best-title" className="pb-[90px] pt-[60px]">
          <div className="mx-auto max-w-[1000px] px-[15px] text-center">
            <h2 id="best-title" className="text-[34px] font-black uppercase leading-[1.1] text-ink md:text-[44px]">
              Best products for this season
            </h2>
            <p className="mt-[20px] text-[16px] leading-[25px]">Hand-picked from our range — rackets, shoes and gear for this season. Updated regularly.</p>
          </div>
          <div className="mx-auto mt-[70px] max-w-site px-[25px] lg:px-0">
            <ProductCarousel products={products} />
          </div>
        </section>
      )}
      <AboutBlock stats={catalogueStats()} />
      <BlogCards />
    </>
  );
}
