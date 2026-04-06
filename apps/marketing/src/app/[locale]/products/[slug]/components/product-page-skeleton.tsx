"use client";

export function ProductPageSkeleton() {
  return (
    <div className="min-h-screen animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-12 bg-gray-200 rounded" />
          <div className="h-4 w-4 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-4 w-4 bg-gray-200 rounded" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Main Product Section */}
      <div className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Image Gallery Skeleton */}
          <div className="flex gap-4">
            {/* Thumbnails */}
            <div className="hidden md:flex flex-col gap-2 w-20">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded" />
              ))}
            </div>
            {/* Main Image */}
            <div className="flex-1">
              <div className="aspect-3/4 bg-gray-200 rounded-lg" />
            </div>
          </div>

          {/* Right: Product Info Skeleton */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <div className="h-8 w-3/4 bg-gray-200 rounded mb-4" />
              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-4 w-4 bg-gray-200 rounded" />
                  ))}
                </div>
                <div className="h-4 w-20 bg-gray-200 rounded" />
              </div>
              {/* Price */}
              <div className="flex items-center gap-3">
                <div className="h-8 w-32 bg-gray-200 rounded" />
                <div className="h-6 w-24 bg-gray-200 rounded" />
                <div className="h-6 w-16 bg-gray-200 rounded" />
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gray-200" />
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="h-4 w-16 bg-gray-200 rounded" />
              </div>
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 w-14 bg-gray-200 rounded" />
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <div className="h-4 w-16 bg-gray-200 rounded mb-2" />
              <div className="h-10 w-32 bg-gray-200 rounded" />
            </div>

            {/* Favourite & Wishlist */}
            <div className="flex gap-3">
              <div className="flex-1 h-12 bg-gray-200 rounded" />
              <div className="flex-1 h-12 bg-gray-200 rounded" />
            </div>

            {/* Add to Cart & Buy Now */}
            <div className="space-y-3">
              <div className="h-12 w-full bg-gray-200 rounded" />
              <div className="h-12 w-full bg-gray-300 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section Skeleton */}
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200" />
                  <div>
                    <div className="h-4 w-24 bg-gray-200 rounded mb-1" />
                    <div className="h-3 w-16 bg-gray-200 rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-gray-200 rounded" />
                  <div className="h-4 w-3/4 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related Products Skeleton */}
      <div className="container mx-auto px-4 py-12">
        <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="aspect-337/505 bg-gray-200 rounded mb-3" />
              <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-1/2 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
