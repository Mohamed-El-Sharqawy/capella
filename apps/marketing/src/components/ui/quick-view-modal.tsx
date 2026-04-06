"use client";

import { useState, useEffect } from "react";
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

  // Animation states
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Small delay to trigger enter animation
      requestAnimationFrame(() => setIsVisible(true));
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  // Normalize images - handle both flat (url directly) and nested (image.url) structures
  const rawImages = selectedVariant?.images ?? [];
  const images = rawImages.map((img: any) => ({
    url: img.url || img.image?.url || "",
  }));
  const price = selectedVariant?.price ?? 0;
  const compareAtPrice = selectedVariant?.compareAtPrice;

  const discountPercent =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : null;

  // Get unique colors
  const uniqueColors = product.variants
    ?.filter((v) => v.color)
    .reduce((acc, v) => {
      if (v.color && !acc.find((c) => c.id === v.color!.id)) {
        acc.push({ ...v.color, variantId: v.id });
      }
      return acc;
    }, [] as Array<{ id: string; hex: string; nameEn: string; nameAr: string; variantId: string }>);

  // Get unique sizes
  const uniqueSizes = product.variants
    ?.filter((v) => v.size)
    .reduce((acc, v) => {
      if (v.size && !acc.find((s) => s.id === v.size!.id)) {
        acc.push({ ...v.size, variantId: v.id });
      }
      return acc;
    }, [] as Array<{ id: string; nameEn: string; nameAr: string; position: number; variantId: string }>)
    .sort((a, b) => a.position - b.position);

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

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with fade */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"
          }`}
        onClick={handleClose}
      />
      {/* Modal with slide animation */}
      <div
        className={`relative bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto transition-all duration-300 ease-out ${isVisible
          ? "opacity-100 translate-x-0"
          : isClosing
            ? "opacity-0 translate-x-8"
            : "opacity-0 -translate-x-8"
          }`}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 hover:bg-muted bg-white border border-gray-200 rounded-full"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">

          {/* Image Gallery */}
          <div className="relative aspect-square bg-neutral-100 rounded-lg overflow-hidden">
            {images.length > 0 ? (
              <>
                <Image
                  src={images[currentImageIndex]?.url ?? ""}
                  alt={name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No Image
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">{name}</h2>
              <div className="flex items-center gap-2 mt-2">
                {compareAtPrice && compareAtPrice > price && (
                  <span className="text-lg text-muted-foreground line-through">
                    LE {compareAtPrice.toLocaleString()}
                  </span>
                )}
                <span className="text-xl font-bold text-red-600">
                  LE {price.toLocaleString()}
                </span>
                {discountPercent && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                    -{discountPercent}%
                  </span>
                )}
              </div>
            </div>

            <p className="text-muted-foreground text-sm line-clamp-3">
              {description}
            </p>

            {/* Color Selection */}
            {uniqueColors && uniqueColors.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">
                  {t("color")}:{" "}
                  <span className="font-normal">
                    {isArabic
                      ? selectedVariant?.color?.nameAr
                      : selectedVariant?.color?.nameEn}
                  </span>
                </p>
                <div className="flex gap-2">
                  {uniqueColors.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => handleColorSelect(color.id)}
                      className={`h-8 w-8 rounded-full border-2 transition ${selectedVariant?.color?.id === color.id
                        ? "border-primary ring-2 ring-primary ring-offset-2"
                        : "border-border"
                        }`}
                      style={{ backgroundColor: color.hex }}
                      aria-label={isArabic ? color.nameAr : color.nameEn}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {uniqueSizes && uniqueSizes.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">{t("size")}:</p>
                <div className="flex flex-wrap gap-2">
                  {uniqueSizes.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => handleSizeSelect(size.id)}
                      className={`px-4 py-2 text-sm border rounded transition ${selectedVariant?.size?.id === size.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:border-primary"
                        }`}
                    >
                      {isArabic ? size.nameAr : size.nameEn}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <p className="text-sm font-medium mb-2">{t("quantity")}:</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 border rounded hover:bg-muted"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 border rounded hover:bg-muted"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-4">
              <button
                onClick={handleAddToCart}
                className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded hover:bg-primary/90 transition"
              >
                {tCommon("addToCart")} - LE {(price * quantity).toLocaleString()}
              </button>
              <Link
                href={`/products/${product.slug}`}
                className="block w-full py-3 text-center text-sm font-medium hover:underline"
                onClick={onClose}
              >
                View product details →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
