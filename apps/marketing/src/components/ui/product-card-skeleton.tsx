"use client";

export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="relative aspect-337/505 bg-gray-200 rounded" />
      <div className="mt-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="flex gap-1 pt-1">
          <div className="h-4 w-4 rounded-full bg-gray-200" />
          <div className="h-4 w-4 rounded-full bg-gray-200" />
          <div className="h-4 w-4 rounded-full bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

export function ProductCardHorizontalSkeleton() {
  return (
    <div className="flex gap-8 py-8 border-b animate-pulse">
      <div className="relative w-1/3 max-w-[300px] shrink-0">
        <div className="relative aspect-3/4 bg-gray-200 rounded" />
      </div>
      <div className="flex-1 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="flex gap-2 pt-2">
          <div className="h-6 w-6 rounded-full bg-gray-200" />
          <div className="h-6 w-6 rounded-full bg-gray-200" />
          <div className="h-6 w-6 rounded-full bg-gray-200" />
        </div>
        <div className="flex gap-2 pt-2">
          <div className="h-8 w-10 rounded bg-gray-200" />
          <div className="h-8 w-10 rounded bg-gray-200" />
          <div className="h-8 w-10 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
