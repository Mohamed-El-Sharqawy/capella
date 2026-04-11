import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface ProductBreadcrumbProps {
  productName: string;
  collectionName?: string;
  collectionSlug?: string;
  locale: string;
}

export function ProductBreadcrumb({ productName, collectionName, collectionSlug, locale }: ProductBreadcrumbProps) {
  const isArabic = locale === "ar";
  const homeText = isArabic ? "الرئيسية" : "HOME";
  const productsText = isArabic ? "المنتجات" : "PRODUCTS";

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className={`flex items-center gap-2 text-[10px] md:text-xs font-light tracking-[0.2em] text-gray-400 uppercase ${isArabic ? "flex-row-reverse" : "flex-row"}`}>
        <Link href="/" className="hover:text-black transition-colors">
          {homeText}
        </Link>
        <ChevronRight className={`h-3 w-3 ${isArabic ? "rotate-180" : ""}`} />
        
        <Link href="/products" className="hover:text-black transition-colors">
          {productsText}
        </Link>
        <ChevronRight className={`h-3 w-3 ${isArabic ? "rotate-180" : ""}`} />

        {collectionName && collectionSlug && (
          <>
            <Link href={`/collections/${collectionSlug}`} className="hover:text-black transition-colors">
              {collectionName}
            </Link>
            <ChevronRight className={`h-3 w-3 ${isArabic ? "rotate-180" : ""}`} />
          </>
        )}
        
        <span className="text-gray-900 truncate max-w-[150px] md:max-w-none">
          {productName}
        </span>
      </nav>
    </div>
  );
}
