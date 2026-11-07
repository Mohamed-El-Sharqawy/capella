import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface CollectionBreadcrumbProps {
  /** Current collection title (last crumb). */
  title: string;
  locale: string;
}

/**
 * Visible breadcrumb on collection pages: Home > Collections > {Title}.
 * Mirrors the BreadcrumbList JSON-LD emitted by the collection page.
 * Server-safe: rendered both in the SEO fallback (crawler/SSR view) and in
 * the hydrated collection page so it never disappears.
 */
export function CollectionBreadcrumb({ title, locale }: CollectionBreadcrumbProps) {
  const t = useTranslations("collection");
  const isArabic = locale === "ar";

  return (
    <nav
      aria-label={isArabic ? "مسار التنقل" : "Breadcrumb"}
      className={`flex items-center justify-center gap-2 text-xs font-light text-gray-400 uppercase ${isArabic ? "flex-row-reverse" : "flex-row"}`}
      style={{ letterSpacing: isArabic ? "0em" : "0.15em" }}
    >
      <Link href="/" className="hover:text-black transition-colors">
        {t("breadcrumbHome")}
      </Link>
      <ChevronRight className={`h-3 w-3 ${isArabic ? "rotate-180" : ""}`} />
      <Link href="/collections" className="hover:text-black transition-colors">
        {t("breadcrumbCollections")}
      </Link>
      <ChevronRight className={`h-3 w-3 ${isArabic ? "rotate-180" : ""}`} />
      <span className="text-gray-900 truncate max-w-[180px] md:max-w-none" style={{ textTransform: "none" }}>
        {title}
      </span>
    </nav>
  );
}
