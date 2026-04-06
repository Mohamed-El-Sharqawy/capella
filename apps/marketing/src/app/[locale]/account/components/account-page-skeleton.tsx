"use client";

export function AccountPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      {/* Greeting */}
      <div className="h-8 w-48 bg-gray-200 rounded mb-8" />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Skeleton */}
        <div className="lg:w-64 shrink-0">
          <div className="bg-white rounded-lg border p-4 space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <div className="h-5 w-5 bg-gray-200 rounded" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-5 w-8 bg-gray-200 rounded ml-auto" />
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex items-center gap-3 p-3">
                <div className="h-5 w-5 bg-gray-200 rounded" />
                <div className="h-4 w-16 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="flex-1">
          <div className="bg-white rounded-lg border p-6">
            {/* Profile Section */}
            <div className="space-y-6">
              {/* Avatar and Name */}
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-gray-200 rounded-full" />
                <div className="space-y-2">
                  <div className="h-6 w-32 bg-gray-200 rounded" />
                  <div className="h-4 w-48 bg-gray-200 rounded" />
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                    <div className="h-10 w-full bg-gray-200 rounded" />
                  </div>
                ))}
              </div>

              {/* Phone Section */}
              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="flex gap-2">
                  <div className="h-10 w-full bg-gray-200 rounded" />
                  <div className="h-10 w-24 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
