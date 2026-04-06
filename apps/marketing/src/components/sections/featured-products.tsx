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
    <section className="mx-auto max-w-7xl px-4 py-16">
      <AnimateOnScroll direction="up">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">{t("title")}</h2>
          <p className="text-muted-foreground">{t("subtitle")}</p>
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
