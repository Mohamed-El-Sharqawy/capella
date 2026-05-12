import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

interface AboutPageProps {
  params: { locale: string };
}

export default function AboutPage({ params: { locale } }: AboutPageProps) {
  setRequestLocale(locale);
  const t = useTranslations("about");
  const isArabic = locale === "ar";

  return (
    <div className="flex flex-col">
      {/* Story Section */}
      <section className="pt-20 md:pt-24 pb-16 md:pb-20 bg-white mt-[97px] md:mt-[113px]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <AnimateOnScroll direction="up">
            <div className={`space-y-8`}>
              <h2 className="text-2xl md:text-3xl font-light uppercase" {...(!isArabic && { style: { letterSpacing: "0.25em" } })}>
                {t("story.title")}
              </h2>
              <div className={`w-16 h-px bg-black/20`}
              />
              <p className="text-lg md:text-xl leading-relaxed font-light text-neutral-700">
                {t("story.content")}
              </p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-24 md:py-32 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <AnimateOnScroll direction="up">
            <div className={`mb-16 space-y-4`}>
              <h2 className="text-2xl md:text-3xl font-light uppercase" {...(!isArabic && { style: { letterSpacing: "0.25em" } })}>
                {t("philosophy.title")}
              </h2>
              <div className={`w-16 h-px bg-black/20`} />
            </div>
          </AnimateOnScroll>

          <div className={`grid grid-cols-1 md:grid-cols-3 gap-12 ${locale === "ar" ? "text-right" : "text-left"}`}>
            {[
              {
                title: t("philosophy.quality"),
                desc: t("philosophy.qualityDesc"),
                img: "/about/about_quality.png"
              },
              {
                title: t("philosophy.craftsmanship"),
                desc: t("philosophy.craftsmanshipDesc"),
                img: "/about/about_caftsmanship.png"
              },
              {
                title: t("philosophy.innovation"),
                desc: t("philosophy.innovationDesc"),
                img: "/about/about_modern.png"
              }
            ].map((p, i) => (
              <AnimateOnScroll key={i} direction="up" delay={i * 0.1}>
                <div className="space-y-6">
                  <div className="relative overflow-hidden aspect-square rounded-md">
                    <Image src={p.img} alt={p.title} width={400} height={400} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-sm md:text-base font-medium uppercase" {...(!isArabic && { style: { letterSpacing: "0.2em" } })}>
                    {p.title}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-light">
                    {p.desc}
                  </p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 bg-black text-white">
        <div className={`max-w-7xl mx-auto px-4 ${locale === "ar" ? "text-right" : "text-left"}`}>
          <AnimateOnScroll direction="up">
            <h2 className="text-2xl md:text-3xl font-light uppercase mb-12" {...(!isArabic && { style: { letterSpacing: "0.3em" } })}>
              {t("exploreCollection")}
            </h2>
            <a
              href="/collections/all-products"
              className={`inline-block px-12 py-4 border border-white text-xs uppercase hover:bg-white hover:text-black transition-all duration-500`} {...(!isArabic && { style: { letterSpacing: "0.1em" } })}
            >
              {t("shopNow")}
            </a>
          </AnimateOnScroll>
        </div>
      </section>
    </div>
  );
}
