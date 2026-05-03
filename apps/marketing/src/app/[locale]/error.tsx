"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <h2 className="text-2xl font-semibold mb-2">Something went wrong</h2>
      <p className="text-muted-foreground mb-6 text-center max-w-md">
        We encountered an error while loading this page. Please try again.
      </p>
      <button
        onClick={reset}
        className="px-6 py-2.5 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
