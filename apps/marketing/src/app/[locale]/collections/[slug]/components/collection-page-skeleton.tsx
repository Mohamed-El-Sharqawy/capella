"use client";

import { ProductCardSkeleton } from "@/components/ui/product-card-skeleton";

export function CollectionPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-6">
        {/* Filter Button */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-gray-200 rounded" />
          <div className="h-4 w-12 bg-gray-200 rounded" />
        </div>

        {/* Grid View Toggle */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-6 w-6 bg-gray-200 rounded" />
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="h-10 w-36 bg-gray-200 rounded" />
      </div>

      {/* Product Grid Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>

      {/* Load More Skeleton */}
      <div className="flex justify-center mt-8">
        <div className="h-10 w-32 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
