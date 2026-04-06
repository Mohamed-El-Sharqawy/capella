"use client";

import { forwardRef } from "react";
import { useTranslations } from "next-intl";
import type { ProductMeta } from "../types";

interface LoadMoreProps {
  isLoading: boolean;
  meta: ProductMeta;
  hasProducts: boolean;
}

export const LoadMore = forwardRef<HTMLDivElement, LoadMoreProps>(
  ({ isLoading, meta, hasProducts }, ref) => {
    const t = useTranslations("collection");

    return (
      <div ref={ref} className="py-8 flex justify-center">
        {isLoading && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />}
        {!isLoading && meta.page >= meta.totalPages && hasProducts && (
          <p className="text-sm text-muted-foreground">{t("allLoaded")}</p>
        )}
      </div>
    );
  }
);

LoadMore.displayName = "LoadMore";
