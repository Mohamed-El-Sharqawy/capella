"use client";

export function CollectionsPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse">
      {/* Title */}
      <div className="h-9 w-64 bg-gray-200 rounded mx-auto mb-6" />

      {/* Search Input */}
      <div className="max-w-md mx-auto mb-8">
        <div className="h-12 w-full bg-gray-200 rounded-lg" />
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-square bg-gray-200 rounded-lg" />
            <div className="h-5 w-3/4 bg-gray-200 rounded mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
