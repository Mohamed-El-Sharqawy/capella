"use client";

import { useState } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCart } from "@/contexts/cart-context";
import { createCartItemFromVariant } from "@/lib/cart";
import type { Product, ProductVariant } from "@ecommerce/shared-types";

interface FrequentlyBoughtTogetherProps {
  currentProduct: Product;
  relatedProducts: Product[];
  locale: string;
  selectedVariant: ProductVariant | null;
}

export function FrequentlyBoughtTogether({
  currentProduct,
  relatedProducts,
  locale,
  selectedVariant,
}: FrequentlyBoughtTogetherProps) {
  const t = useTranslations("product");
  const { addItem } = useCart();
  const isArabic = locale === "ar";

  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set([currentProduct.id, ...relatedProducts.map((p) => p.id)])
  );

  const toggleProduct = (productId: string) => {
    if (productId === currentProduct.id) return;

    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const allProducts = [currentProduct, ...relatedProducts];

  const totalPrice = allProducts
    .filter((p) => selectedProducts.has(p.id))
    .reduce((sum, p) => {
      if (p.id === currentProduct.id && selectedVariant) {
        return sum + (selectedVariant.price || 0);
      }
      const variant = p.variants?.[0];
      return sum + (variant?.price || 0);
    }, 0);

  const selectedCount = selectedProducts.size;

  const handleAddAllToCart = () => {
    allProducts.forEach((p) => {
      if (!selectedProducts.has(p.id)) return;

      const variant = p.id === currentProduct.id ? selectedVariant : p.variants?.[0];
      if (!variant) return;

      const cartItem = createCartItemFromVariant(
        variant,
        {
          id: p.id,
          slug: p.slug,
          nameEn: p.nameEn,
          nameAr: p.nameAr,
        },
        1
      );
      addItem(cartItem);
    });
  };

  const getProductImage = (p: Product) => {
    if (p.id === currentProduct.id && selectedVariant?.images?.[0]?.url) {
      return selectedVariant.images[0].url;
    }
    return p.variants?.[0]?.images?.[0]?.url || "";
  };

  const getProductPrice = (p: Product) => {
    if (p.id === currentProduct.id && selectedVariant) {
      return selectedVariant.price || 0;
    }
    const variant = p.variants?.[0];
    return variant?.price || 0;
  };

  if (relatedProducts.length < 2) return null;

  return (
    <div className="container mx-auto px-4 py-12 border-t">
      <h2 className="text-xl font-semibold text-center mb-2">{t("frequentlyBought")}</h2>
      <p className="text-center text-muted-foreground text-sm mb-6">{t("frequentlyBoughtDesc")}</p>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="bg-gray-50 rounded-2xl p-4 border">
          <div
            className="flex items-center gap-2 overflow-x-auto pt-4 pb-4 -mx-2 px-2 scrollbar-hide"
          >
            {allProducts.map((p, index) => {
              const isSelected = selectedProducts.has(p.id);
              const isCurrentProduct = p.id === currentProduct.id;
              const productName = isArabic ? p.nameAr : p.nameEn;
              const productPrice = getProductPrice(p);
              const productImage = getProductImage(p);

              return (
                <div key={p.id} className="flex items-center gap-2 shrink-0">
                  <div
                    className={`relative flex flex-col items-center p-3 rounded-xl border-2 transition-all cursor-pointer w-[100px] ${isSelected
                      ? "border-black bg-white shadow-sm"
                      : "border-gray-200 bg-white opacity-50"
                      }`}
                    onClick={() => toggleProduct(p.id)}
                  >
                    <div
                      className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all z-10 ${isSelected ? "bg-black border-black" : "bg-white border-gray-300"
                        }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>

                    {isCurrentProduct && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] px-1.5 py-0.5 rounded-full whitespace-nowrap z-10">
                        {t("thisItem")}
                      </span>
                    )}

                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-neutral-100 mb-2">
                      {productImage && (
                        <Image
                          src={productImage}
                          alt={productName}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      )}
                    </div>

                    <p className="text-[10px] font-medium text-center line-clamp-1 w-full">
                      {productName}
                    </p>

                    <p className="text-xs font-semibold mt-0.5">LE {productPrice.toLocaleString()}</p>
                  </div>

                  {index < allProducts.length - 1 && (
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white border text-gray-400 font-bold text-sm shrink-0">
                      +
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t my-3" />

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">
                {selectedCount} {t("items")}
              </p>
              <p className="text-lg font-bold">LE {totalPrice.toLocaleString()}</p>
            </div>

            <button
              onClick={handleAddAllToCart}
              disabled={selectedCount === 0}
              className="flex-1 max-w-[180px] py-2.5 px-4 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("addAllToCart")}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex flex-col lg:flex-row items-center justify-center gap-8">
        <div className="flex flex-wrap items-center justify-center gap-4">
          {allProducts.map((p, index) => {
            const isSelected = selectedProducts.has(p.id);
            const isCurrentProduct = p.id === currentProduct.id;
            const productName = isArabic ? p.nameAr : p.nameEn;
            const productPrice = getProductPrice(p);
            const productImage = getProductImage(p);

            return (
              <div key={p.id} className="flex items-center gap-4">
                <div
                  className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all cursor-pointer ${isSelected
                    ? "border-black bg-white shadow-md"
                    : "border-gray-200 bg-gray-50 opacity-60"
                    } ${isCurrentProduct ? "ring-2 ring-black ring-offset-2" : ""}`}
                  onClick={() => toggleProduct(p.id)}
                >
                  <div
                    className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all z-10 ${isSelected ? "bg-black border-black" : "bg-white border-gray-300"
                      } ${isCurrentProduct ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>

                  {isCurrentProduct && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">
                      {t("thisItem")}
                    </span>
                  )}

                  <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-neutral-100 mb-3">
                    {productImage && (
                      <Image
                        src={productImage}
                        alt={productName}
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    )}
                  </div>

                  <p className="text-sm font-medium text-center line-clamp-2 max-w-[120px]">
                    {productName}
                  </p>

                  <p className="text-sm font-semibold mt-1">LE {productPrice.toLocaleString()}</p>
                </div>

                {index < allProducts.length - 1 && (
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 font-bold text-lg">
                    +
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 rounded-2xl border min-w-[240px]">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">
              {t("totalForItems", { count: selectedCount })}
            </p>
            <p className="text-2xl font-bold">LE {totalPrice.toLocaleString()}</p>
          </div>

          <button
            onClick={handleAddAllToCart}
            disabled={selectedCount === 0}
            className="w-full py-3 px-6 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("addToCartCount", { count: selectedCount })}
          </button>

          <p className="text-xs text-muted-foreground text-center">{t("clickToAddRemove")}</p>
        </div>
      </div>
    </div>
  );
}
