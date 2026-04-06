"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/auth-context";
import { ReviewModal } from "@/components/ui/review-modal";
import { SizeGuideModal } from "@/components/ui/size-guide-modal";
import { trackProductView } from "@/lib/analytics";
import {
  useProductVariant,
  useProductActions,
  useProductReviews,
  useFixedBar,
} from "./hooks";
import {
  ProductBreadcrumb,
  ImageGallery,
  ProductInfo,
  ReviewsSection,
  RelatedProducts,
  FixedBottomBar,
  FrequentlyBoughtTogether,
  ProductPageSkeleton,
} from "./components";
import { FREQUENTLY_BOUGHT_LIMIT } from "./constants";
import type { ProductPageClientProps } from "./types";

function ProductPageContent({ product, relatedProducts, locale }: ProductPageClientProps) {
  const t = useTranslations("product");
  const isArabic = locale === "ar";
  const { user } = useAuth();

  // Modals
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  // Hooks
  const {
    selectedVariant,
    selectedImageIndex,
    setSelectedImageIndex,
    uniqueColors,
    uniqueSizes,
    getSizeAvailability,
    handleColorSelect,
    handleSizeSelect,
  } = useProductVariant(product);

  const {
    quantity,
    incrementQuantity,
    decrementQuantity,
    handleAddToCart,
    handleBuyNow,
    isFavourite,
    isInWishlist,
    toggleFavourite,
    toggleWishlist,
    getCartItem,
    updateCartQuantity,
  } = useProductActions(product, locale);

  const { reviews, isLoading: isLoadingReviews, averageRating, reviewCount, invalidateReviews } = useProductReviews(product.id);

  const { showFixedBar, productInfoRef } = useFixedBar();

  // Track product view on mount (only once)
  const hasTrackedView = useRef(false);
  useEffect(() => {
    if (!hasTrackedView.current) {
      hasTrackedView.current = true;
      const productName = isArabic ? product.nameAr : product.nameEn;
      const productPrice = product.variants?.[0]?.price;
      trackProductView(product.id, product.slug, productName, productPrice);
    }
  }, [product.id, product.slug, product.nameEn, product.nameAr, product.variants, isArabic]);

  // Derived values
  const name = isArabic ? product.nameAr : product.nameEn;
  const price = selectedVariant?.price ?? 0;
  const compareAtPrice = selectedVariant?.compareAtPrice;
  const images = selectedVariant?.images ?? [];
  const discountPercent =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : null;

  // Get cart item for selected variant
  const cartItem = getCartItem(selectedVariant?.id ?? null);

  return (
    <div className="min-h-screen">
      <ProductBreadcrumb productName={name} />

      {/* Main Product Section */}
      <div ref={productInfoRef} className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Image Gallery */}
          <ImageGallery
            images={images}
            selectedIndex={selectedImageIndex}
            onSelectIndex={setSelectedImageIndex}
            productName={name}
            locale={locale}
          />

          {/* Right: Product Info */}
          <ProductInfo
            name={name}
            price={price}
            compareAtPrice={compareAtPrice}
            discountPercent={discountPercent}
            reviewCount={reviewCount}
            locale={locale}
            uniqueColors={uniqueColors}
            uniqueSizes={uniqueSizes}
            selectedVariant={selectedVariant}
            onColorSelect={handleColorSelect}
            onSizeSelect={handleSizeSelect}
            getSizeAvailability={getSizeAvailability}
            hasSizeGuide={!!product.sizeGuideUrl}
            onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
            quantity={quantity}
            onIncrement={incrementQuantity}
            onDecrement={decrementQuantity}
            onAddToCart={() => handleAddToCart(selectedVariant)}
            onBuyNow={() => handleBuyNow(selectedVariant)}
            isFavourite={isFavourite}
            isInWishlist={isInWishlist}
            onToggleFavourite={toggleFavourite}
            onToggleWishlist={toggleWishlist}
            cartItem={cartItem}
            onUpdateCartQuantity={updateCartQuantity}
          />
        </div>
      </div>

      {/* Customer Reviews */}
      <ReviewsSection
        reviews={reviews}
        isLoading={isLoadingReviews}
        averageRating={averageRating}
        locale={locale}
        currentUserId={user?.id}
        onWriteReview={() => setIsReviewModalOpen(true)}
      />

      {/* Frequently Bought Together */}
      {relatedProducts.length >= FREQUENTLY_BOUGHT_LIMIT && (
        <FrequentlyBoughtTogether
          currentProduct={product}
          relatedProducts={relatedProducts.slice(0, FREQUENTLY_BOUGHT_LIMIT)}
          locale={locale}
          selectedVariant={selectedVariant}
        />
      )}

      {/* Related Products */}
      <RelatedProducts products={relatedProducts} locale={locale} />

      {/* Fixed Bottom Bar */}
      <FixedBottomBar
        show={showFixedBar}
        name={name}
        price={price}
        imageUrl={images[0]?.url}
        selectedVariant={selectedVariant}
        quantity={quantity}
        onIncrement={incrementQuantity}
        onDecrement={decrementQuantity}
        onAddToCart={() => handleAddToCart(selectedVariant)}
        locale={locale}
      />

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        product={product}
        locale={locale}
        onReviewSubmitted={invalidateReviews}
      />

      {/* Size Guide Modal */}
      {product.sizeGuideUrl && (
        <SizeGuideModal
          isOpen={isSizeGuideOpen}
          onClose={() => setIsSizeGuideOpen(false)}
          imageUrl={product.sizeGuideUrl}
          locale={locale}
        />
      )}
    </div>
  );
}

export function ProductPageClient(props: ProductPageClientProps) {
  return (
    <Suspense fallback={<ProductPageSkeleton />}>
      <ProductPageContent {...props} />
    </Suspense>
  );
}
