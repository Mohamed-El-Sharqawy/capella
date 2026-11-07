import Image from "next/image";
import type { Product } from "@ecommerce/shared-types";
import { CollectionIntro } from "./collection-intro";
import { CollectionBreadcrumb } from "./collection-breadcrumb";

interface CollectionSeoFallbackProps {
  title: string;
  description?: string | null;
  locale: string;
  products: Product[];
}

/**
 * Server-rendered stand-in shown until the interactive collection page
 * hydrates. The interactive page reads filters from the URL, so it can't be
 * server-rendered; without this, crawlers (and AI bots that don't run JS)
 * would see an empty skeleton. Same heading, products and links as the real
 * page, so it is not cloaking.
 */
export function CollectionSeoFallback({ title, description, locale, products }: CollectionSeoFallbackProps) {
  const isArabic = locale === "ar";
  return (
    <div className="pb-8 pt-32 md:pt-36">
      <div className="max-w-7xl mx-auto px-4 pt-8">
        <CollectionBreadcrumb title={title} locale={locale} />
        <CollectionIntro title={title} description={description} locale={locale} />
        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => {
            const variant = product.variants?.[0];
            const name = (isArabic ? product.nameAr : product.nameEn).trim();
            const image = variant?.images?.[0]?.url;
            return (
              <li key={product.id}>
                <a href={`/${locale}/products/${product.slug}`} className="block">
                  <div className="relative overflow-hidden rounded-2xl bg-neutral-50" style={{ aspectRatio: "3/4" }}>
                    {image && (
                      <Image
                        src={image}
                        alt={name}
                        fill
                        className="object-contain"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    )}
                  </div>
                  <div className="px-1 pt-3 space-y-1">
                    <h2 className="text-sm text-neutral-800">{name}</h2>
                    {variant && (
                      <p className="text-xs font-semibold">AED {variant.price.toLocaleString()}</p>
                    )}
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
