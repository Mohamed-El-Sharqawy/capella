"use client";

export function CollectionsPageSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-32 md:pt-40 pb-16 md:pb-24 animate-pulse">
        <div className="text-center mb-10 md:mb-14">
          <div className="h-8 w-48 bg-neutral-200 rounded mx-auto" />
          <div className="w-12 h-px bg-neutral-200 mx-auto mt-5" />
        </div>

        <div className="max-w-md mx-auto mb-10">
          <div className="h-11 w-full bg-neutral-200 rounded-full" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-3/4 bg-neutral-200 rounded-sm" />
              <div className="h-4 w-2/3 bg-neutral-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
