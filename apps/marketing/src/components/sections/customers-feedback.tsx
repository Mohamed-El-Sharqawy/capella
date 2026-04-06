"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Star } from "lucide-react";
import type { Review } from "@ecommerce/shared-types";

interface CustomersFeedbackProps {
  reviews: Review[];
  locale: string;
}

export function CustomersFeedback({ reviews, locale }: CustomersFeedbackProps) {
  if (reviews.length === 0) return null;

  const isArabic = locale === "ar";

  return (
    <section className="py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold tracking-tight mb-8">
          {isArabic ? "آراء العملاء" : "Customers Feedback"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.slice(0, 3).map((review) => (
            <ReviewCard key={review.id} review={review} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ReviewCard({ review, locale }: { review: Review; locale: string }) {
  const isArabic = locale === "ar";
  const product = review.product;
  const variant = product?.variants?.[0];
  const imageUrl = variant?.images?.[0]?.image?.url;
  const productName = isArabic ? product?.nameAr : product?.nameEn;
  const price = variant?.price ?? 0;
  const compareAtPrice = variant?.compareAtPrice;

  return (
    <div className="space-y-4">
      {/* Stars */}
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < review.rating
                ? "fill-orange-400 text-orange-400"
                : "fill-gray-200 text-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Review Title */}
      <h3 className="font-semibold text-sm uppercase tracking-wide">
        {review.title}
      </h3>

      {/* Review Content */}
      <p className="text-sm text-muted-foreground line-clamp-3">
        {review.content}
      </p>

      {/* Customer Name */}
      <p className="text-sm font-medium">{review.customerName}</p>

      {/* Linked Product */}
      {product && (
        <Link
          href={`/products/${product.slug}`}
          target="_blank"
          className="flex items-center gap-3 mt-4 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
        >
          {imageUrl && (
            <div className="relative w-12 h-16 rounded overflow-hidden bg-muted shrink-0">
              <Image
                src={imageUrl}
                alt={productName || "Product"}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">
              {productName}
            </p>
            <div className="flex items-center gap-2">
              {compareAtPrice && compareAtPrice > price && (
                <span className="text-xs text-muted-foreground line-through">
                  LE {compareAtPrice.toLocaleString()}
                </span>
              )}
              <span className="text-sm font-semibold">
                LE {price.toLocaleString()}
              </span>
            </div>
          </div>
        </Link>
      )}
    </div>
  );
}
