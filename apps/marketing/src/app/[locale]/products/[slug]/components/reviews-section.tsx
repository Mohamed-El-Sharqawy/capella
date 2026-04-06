"use client";

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Review } from "../types";

interface ReviewsSectionProps {
  reviews: Review[];
  isLoading: boolean;
  averageRating: number;
  locale: string;
  currentUserId?: string;
  onWriteReview: () => void;
}

export function ReviewsSection({
  reviews,
  isLoading,
  averageRating,
  locale,
  currentUserId,
  onWriteReview,
}: ReviewsSectionProps) {
  const t = useTranslations("product");
  const isArabic = locale === "ar";

  return (
    <div className="container mx-auto px-4 py-12 border-t">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-2">{t("customerReviews")}</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= averageRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {reviews.length} {reviews.length !== 1 ? t("reviews") : t("review")}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onWriteReview}
          className="px-6 py-2 bg-black text-white text-sm rounded hover:bg-gray-800 transition"
        >
          {t("writeReview")}
        </button>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t("noReviews")}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => {
            const isOwnReview = currentUserId && review.userId === currentUserId;
            const isPending = !review.isApproved;
            
            return (
              <div key={review.id} className={`border-b pb-6 ${isPending && isOwnReview ? "bg-amber-50/30 -mx-4 px-4 py-4 rounded-lg" : ""}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                      {review.customerName?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                    <span className="font-medium text-sm">{review.customerName || "Anonymous"}</span>
                    {review.userId && (
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{t("verified")}</span>
                    )}
                    {isPending && isOwnReview && (
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">
                        {isArabic ? "قيد المراجعة" : "Pending Approval"}
                      </span>
                    )}
                  </div>
                </div>
                {review.title && <h4 className="font-semibold text-sm mb-1">{review.title}</h4>}
                <p className="text-sm text-muted-foreground">{review.content}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(review.createdAt).toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
