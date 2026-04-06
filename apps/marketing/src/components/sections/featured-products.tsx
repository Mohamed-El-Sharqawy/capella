import { getTranslations } from "next-intl/server";
import { getFeaturedProducts } from "@/lib/api";
import { AnimateOnScroll, ProductSlider } from "@/components/ui";
import type { Product } from "@ecommerce/shared-types";

interface FeaturedProductsProps {
  locale: string;
  products?: Product[];
}

export async function FeaturedProducts({
  locale,
  products: initialProducts,
}: FeaturedProductsProps) {
  const t = await getTranslations("home.featured");

  const products = initialProducts ?? (await getFeaturedProducts());

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
      <AnimateOnScroll direction="up">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-2xl md:text-3xl font-light uppercase tracking-[0.25em]">{t("title")}</h2>
          <div className="w-16 h-px bg-black/20 mx-auto" />
          <p className="text-xs md:text-sm uppercase tracking-widest text-muted-foreground">{t("subtitle")}</p>
        </div>
      </AnimateOnScroll>

      {products.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          No featured products available.
        </p>
      ) : (
        <AnimateOnScroll direction="up" delay={0.1}>
          <ProductSlider products={products} locale={locale} />
        </AnimateOnScroll>
      )}
    </section>
  );
}
