"use client";

import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface ProductBreadcrumbProps {
  productName: string;
}

export function ProductBreadcrumb({ productName }: ProductBreadcrumbProps) {
  const t = useTranslations("product");

  return (
    <div className="container mx-auto px-4 py-4">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          {t("home")}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{productName}</span>
      </nav>
    </div>
  );
}
