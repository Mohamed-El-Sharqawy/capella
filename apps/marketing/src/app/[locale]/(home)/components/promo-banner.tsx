import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AnimateOnScroll } from "@/components/ui";

export async function PromoBanner() {
  const t = await getTranslations("home.promoBanner");

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
      <AnimateOnScroll direction="up">
        <div className="relative h-full w-full overflow-hidden rounded-md group" style={{
          minHeight: "700px",
          // background: "url(/promo/promo.png) center / cover no-repeat"
        }}>
          <Image loading="lazy" src="/promo/promo.png" alt="Promo" fill className="object-cover" sizes="100vw" quality={100} />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
          <div className="absolute inset-x-0 w-full  text-white text-center p-6 space-y-8" style={{
            bottom: "84px"
          }}>
            <div className="space-y-4 max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-light uppercase tracking-[0.3em]">
                {t("title")}
              </h2>
              <p className="text-base md:text-lg tracking-[0.2em] font-light opacity-90">
                {t("description")}
              </p>
            </div>
            <Link
              href="/collections/all-products"
              className="px-10 py-4 bg-white text-black text-sm md:text-lg font-medium uppercase tracking-[0.3em] hover:bg-black hover:text-white transition-all duration-300"
            >
              {t("cta")}
            </Link>
          </div>
        </div>
      </AnimateOnScroll>
    </section>
  );
}
