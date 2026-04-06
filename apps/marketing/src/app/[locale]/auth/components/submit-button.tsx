"use client";

import { Loader2 } from "lucide-react";

interface SubmitButtonProps {
  isLoading: boolean;
  text: string;
  loadingText: string;
}

export function SubmitButton({ isLoading, text, loadingText }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className="w-full py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        text
      )}
    </button>
  );
}
