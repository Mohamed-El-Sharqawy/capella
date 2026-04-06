"use client";

import Image from "next/image";
import { Bookmark, Loader2, Eye, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { WishlistTabProps } from "../../types";

export function WishlistTab({ locale, products, isLoading, wishlistItems, onRemove }: WishlistTabProps) {
  const t = useTranslations("account.wishlistTab");
  const isArabic = locale === "ar";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          {t("title")} (0)
        </h2>
        <div className="bg-white border rounded-lg p-8 text-center">
          <Bookmark className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {t("noWishlist")}
          </p>
          <Link
            href="/collections"
            className="inline-block mt-4 px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
          >
            {t("startShopping")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        {t("title")} ({products.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((product) => {
          const wishlistItem = wishlistItems.find((w) => w.productId === product.id);
          const variant = product.variants?.[0];
          const imageUrl = (variant?.images?.[0] as any)?.image?.url || variant?.images?.[0]?.url || product.images?.[0]?.url;
          return (
            <div key={product.id} className="bg-white border rounded-lg p-4 flex gap-4">
              <Link href={`/products/${product.slug}`} className="shrink-0">
                <div className="w-24 h-32 bg-gray-100 rounded overflow-hidden relative">
                  {imageUrl && (
                    <Image
                      src={imageUrl}
                      alt={isArabic ? product.nameAr : product.nameEn}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  )}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${product.slug}`} className="font-medium hover:underline line-clamp-2">
                  {isArabic ? product.nameAr : product.nameEn}
                </Link>
                {wishlistItem?.note && (
                  <p className="text-sm text-muted-foreground mt-1 italic">
                    "{wishlistItem.note}"
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {variant?.compareAtPrice && variant.compareAtPrice > variant.price && (
                    <span className="text-sm text-muted-foreground line-through">
                      LE {variant.compareAtPrice.toLocaleString()}
                    </span>
                  )}
                  <span className="font-semibold text-red-600">
                    LE {variant?.price?.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {variant?.stock && variant.stock > 0 ? t("inStock") : t("outOfStock")}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Link
                    href={`/products/${product.slug}`}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-black text-white rounded hover:bg-gray-800 transition"
                  >
                    <Eye className="h-3 w-3" />
                    {isArabic ? "عرض" : "View"}
                  </Link>
                  <button
                    onClick={() => onRemove(product.id)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded hover:bg-red-50 transition"
                  >
                    <Trash2 className="h-3 w-3" />
                    {t("remove")}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
