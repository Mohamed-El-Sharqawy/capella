import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AnimateOnScroll } from "@/components/ui";

interface PromoBannerProps {
  locale: string;
}

export async function PromoBanner({ locale }: PromoBannerProps) {
  const t = await getTranslations("home.promoBanner");

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 overflow-hidden">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-center">
        <AnimateOnScroll direction="left">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              {t("title")}
            </h2>
            <p className="text-muted-foreground max-w-md">{t("description")}</p>
            <Link
              href="/collections/all-products"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              {t("cta")} →
            </Link>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll direction="right">
          <div className="relative w-full md:w-[705px] aspect-705/458 overflow-hidden rounded-lg">
            <Image
              src="https://images.unsplash.com/photo-1509631179647-0177331693ae?w=705&h=458&fit=crop"
              alt="Promo Banner"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 705px"
            />
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
