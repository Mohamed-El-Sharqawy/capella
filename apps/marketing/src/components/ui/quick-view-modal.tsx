"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, Minus, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { Product, ProductVariant } from "@ecommerce/shared-types";
import { useCart } from "@/contexts/cart-context";
import { createCartItemFromVariant } from "@/lib/cart";

interface QuickViewModalProps {
  product: Product;
  locale: string;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModal({
  product,
  locale,
  isOpen,
  onClose,
}: QuickViewModalProps) {
  const t = useTranslations("product");
  const tCommon = useTranslations("common");
  const { addItem } = useCart();

  const isArabic = locale === "ar";
  const name = isArabic ? product.nameAr : product.nameEn;
  const description = isArabic
    ? product.shortDescriptionAr || product.descriptionAr
    : product.shortDescriptionEn || product.descriptionEn;

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    product.variants?.[0] ?? ({} as ProductVariant)
  );
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Swipe logic (Exactly as per hero-banner.tsx)
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  // Animation states
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const activeImages = (selectedVariant?.images ?? []).map((img: any) => ({
    url: img.url || img.image?.url || "",
  }));

  const allOtherImages = product.variants
    ?.filter(v => v.id !== selectedVariant?.id)
    .flatMap(v => v.images ?? [])
    .map((img: any) => img.url || img.image?.url || "")
    .filter(Boolean) ?? [];

  const price = selectedVariant?.price ?? 0;
  const compareAtPrice = selectedVariant?.compareAtPrice;

  const discountPercent =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : null;

  // Get unique colors/sizes
  const uniqueColors = product.variants
    ?.filter((v) => v.color)
    .reduce((acc, v) => {
      if (v.color && !acc.find((c) => c.id === v.color!.id)) {
        acc.push({ ...v.color, variantId: v.id });
      }
      return acc;
    }, [] as Array<{ id: string; hex: string; nameEn: string; nameAr: string; variantId: string }>);

  const uniqueSizes = product.variants
    ?.filter((v) => v.size)
    .reduce((acc, v) => {
      if (v.size && !acc.find((s) => s.id === v.size!.id)) {
        acc.push({ ...v.size, variantId: v.id });
      }
      return acc;
    }, [] as Array<{ id: string; nameEn: string; nameAr: string; position: number; variantId: string }>)
    .sort((a, b) => a.position - b.position);

  const goToNext = useCallback(() => {
    if (activeImages.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % activeImages.length);
  }, [activeImages.length]);

  const goToPrev = useCallback(() => {
    if (activeImages.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + activeImages.length) % activeImages.length);
  }, [activeImages.length]);

  const handleColorSelect = (colorId: string) => {
    const variant = product.variants?.find((v) => v.color?.id === colorId);
    if (variant) {
      setSelectedVariant(variant);
      setCurrentImageIndex(0);
    }
  };

  const handleSizeSelect = (sizeId: string) => {
    const variant = product.variants?.find(
      (v) => v.size?.id === sizeId && v.color?.id === selectedVariant?.color?.id
    );
    if (variant) {
      setSelectedVariant(variant);
    }
  };

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    const cartItem = createCartItemFromVariant(
      selectedVariant,
      { id: product.id, slug: product.slug, nameEn: product.nameEn, nameAr: product.nameAr },
      quantity
    );
    addItem(cartItem);
    onClose();
  };

  // Swipe handlers (exactly like hero-banner.tsx)
  const handleStart = (clientX: number) => {
    setTouchStart(clientX);
    setTouchEnd(null);
  };

  const handleMove = (clientX: number) => {
    if (touchStart !== null) {
      setTouchEnd(clientX);
    }
  };

  const handleEnd = () => {
    if (touchStart === null || touchEnd === null) {
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }

    const distance = touchStart - touchEnd;
    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="hidden" aria-hidden="true">
        {allOtherImages.map((url, i) => (
          <Image key={i} src={url} alt="preload" width={1} height={1} priority={i < 5} />
        ))}
      </div>

      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}
        onClick={handleClose}
      />
      
      <div
        className={`relative bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden transition-all duration-300 ease-out ${isVisible
          ? "opacity-100 translate-x-0"
          : isClosing
            ? "opacity-0 translate-x-8"
            : "opacity-0 -translate-x-8"
        }`}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 p-2 hover:bg-muted bg-white border border-gray-200 rounded-full shadow-sm"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-6 p-0 md:p-6 overflow-auto max-h-[90vh]">
          {/* Gallery Section with HeroBanner-style carousel logic */}
          <div 
            className="relative aspect-square bg-neutral-50 overflow-hidden touch-pan-y select-none cursor-grab active:cursor-grabbing"
            onTouchStart={(e) => handleStart(e.targetTouches[0].clientX)}
            onTouchMove={(e) => handleMove(e.targetTouches[0].clientX)}
            onTouchEnd={handleEnd}
            onMouseDown={(e) => handleStart(e.clientX)}
            onMouseMove={(e) => handleMove(e.clientX)}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
          >
            {/* Fade Gallery exactly like hero-banner.tsx */}
            {activeImages.map((img, i) => (
              <div 
                key={i} 
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  i === currentImageIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                }`}
              >
                <Image
                  src={img.url}
                  alt={`${name} - ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority={i === 0}
                  draggable={false}
                />
              </div>
            ))}

            {/* Navigation Arrows (HeroBanner styling) */}
            {activeImages.length > 1 && (
              <>
                <button
                  onClick={goToPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white transition z-10 bg-black/5 rounded-full backdrop-blur-sm"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white transition z-10 bg-black/5 rounded-full backdrop-blur-sm"
                  aria-label="Next slide"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Dots Indicator (HeroBanner styling) */}
            {activeImages.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
                {activeImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-3 h-3 rounded-full border-2 border-white transition ${index === currentImageIndex ? "bg-white" : "bg-transparent"}`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Detail Section */}
          <div className="space-y-4 p-6 md:p-0">
            <div>
              <h2 className="text-2xl font-bold">{name}</h2>
              <div className="flex items-center gap-2 mt-2">
                {compareAtPrice && compareAtPrice > price && (
                  <span className="text-lg text-muted-foreground line-through">
                    AED {compareAtPrice.toLocaleString()}
                  </span>
                )}
                <span className="text-xl font-bold text-red-600">
                  AED {price.toLocaleString()}
                </span>
                {discountPercent && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                    -{discountPercent}%
                  </span>
                )}
              </div>
            </div>

            <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
              {description}
            </p>

            {uniqueColors && uniqueColors.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">
                  {t("color")}:{" "}
                  <span className="font-normal opacity-70">
                    {isArabic ? selectedVariant?.color?.nameAr : selectedVariant?.color?.nameEn}
                  </span>
                </p>
                <div className="flex gap-2">
                  {uniqueColors.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => handleColorSelect(color.id)}
                      className={`h-9 w-9 rounded-full border-2 transition-all duration-300 ${selectedVariant?.color?.id === color.id
                        ? "border-primary ring-2 ring-primary ring-offset-2 scale-105 shadow-md"
                        : "border-border hover:border-black/30"
                        }`}
                      style={{ backgroundColor: color.hex }}
                      aria-label={isArabic ? color.nameAr : color.nameEn}
                    />
                  ))}
                </div>
              </div>
            )}

            {uniqueSizes && uniqueSizes.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">{t("size")}:</p>
                <div className="flex flex-wrap gap-2">
                  {uniqueSizes.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => handleSizeSelect(size.id)}
                      className={`px-5 py-2.5 text-xs font-semibold border transition-all duration-300 uppercase tracking-widest ${selectedVariant?.size?.id === size.id
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "border-border hover:border-black"
                        }`}
                    >
                      {isArabic ? size.nameAr : size.nameEn}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-medium mb-2">{t("quantity")}:</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 border rounded-none hover:bg-muted transition-colors active:scale-95"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 border rounded-none hover:bg-muted transition-colors active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <button
                onClick={handleAddToCart}
                className="w-full py-4 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-[0.2em] hover:bg-primary/95 transition-all shadow-sm active:scale-[0.98]"
              >
                {tCommon("addToCart")} • AED {(price * quantity).toLocaleString()}
              </button>
              <Link
                href={`/products/${product.slug}`}
                className="block w-full py-4 text-center text-[10px] font-bold uppercase tracking-[0.2em] border border-transparent hover:border-black/10 transition-all"
                onClick={onClose}
              >
                View full product details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

