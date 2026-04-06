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
    <section className="mx-auto max-w-7xl px-4 py-20 md:py-32">
      <AnimateOnScroll direction="up">
        <div className="relative w-full aspect-[21/9] min-h-[300px] overflow-hidden rounded-sm group">
          <Image
            src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1400&h=600&fit=crop"
            alt="Promo Banner"
            fill
            className="object-cover transition-transform duration-1000 group-hover:scale-105"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6 space-y-6">
            <div className="space-y-4 max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-light uppercase tracking-[0.3em]">
                {t("title")}
              </h2>
              <p className="text-xs md:text-sm uppercase tracking-[0.2em] font-light opacity-90">
                {t("description")}
              </p>
            </div>
            <Link
              href="/collections/all-products"
              className="px-10 py-4 bg-white text-black text-[10px] md:text-xs font-medium uppercase tracking-[0.3em] hover:bg-black hover:text-white transition-all duration-300"
            >
              {t("cta")}
            </Link>
          </div>
        </div>
      </AnimateOnScroll>
    </section>
  );
}
