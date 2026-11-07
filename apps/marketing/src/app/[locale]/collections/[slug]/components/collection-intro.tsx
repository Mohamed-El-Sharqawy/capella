import { toPlainText } from "@/lib/text";

/** Below this length a CMS description is a placeholder ("Amour", "test"), not copy. */
const MIN_DESCRIPTION_LENGTH = 40;

interface CollectionIntroProps {
  title: string;
  description?: string | null;
  locale: string;
}

/**
 * Collection heading: the page's single <h1> plus the collection's
 * description (unique on-page text is what gets category pages indexed and
 * ranked). Server-safe: used by the server fallback and the client page.
 */
export function CollectionIntro({ title, description, locale }: CollectionIntroProps) {
  const isArabic = locale === "ar";
  const text = toPlainText(description);
  return (
    <div className="mb-6 text-center">
      <h1
        className="text-xl md:text-2xl font-medium uppercase text-gray-900"
        style={{ letterSpacing: isArabic ? "0em" : "0.2em" }}
      >
        {title}
      </h1>
      {text.length >= MIN_DESCRIPTION_LENGTH && (
        <p className="mt-3 text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed">{text}</p>
      )}
    </div>
  );
}
