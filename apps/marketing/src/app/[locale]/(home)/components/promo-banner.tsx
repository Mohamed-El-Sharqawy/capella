import Image from "next/image";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AnimateOnScroll } from "@/components/ui";
import { apiClient } from "@/lib/api-client";
import type { PromoBanner as PromoBannerType } from "@ecommerce/shared-types";

async function getPromoBanners() {
  try {
    const res = await apiClient<{ success: boolean; data: PromoBannerType[] }>(
      "/api/promo-banners?isActive=true",
      { next: { revalidate: 60 } }
    );
    return res.data ?? [];
  } catch {
    return [];
  }
}

export async function PromoBanner() {
  const locale = await getLocale();
  const banners = await getPromoBanners();

  if (banners.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {banners.map((banner) => {
          const title = locale === "ar" ? banner.titleAr : banner.titleEn;
          const buttonText = locale === "ar" ? banner.buttonTextAr : banner.buttonTextEn;

          return (
            <AnimateOnScroll key={banner.id} direction="up">
              <div className="relative h-full w-full overflow-hidden rounded-md group" style={{
                minHeight: "500px",
              }}>
                <Image
                  loading="lazy"
                  src={banner.imageUrl}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="50vw"
                  quality={100}
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                <div className="absolute inset-x-0 w-full text-white text-center p-6 space-y-8" style={{
                  bottom: "32px"
                }}>
                  <h1 className="text-3xl font-light italic">{title}</h1>
                  <Link
                    href={banner.linkUrl}
                    className="px-10 py-4 bg-white text-black text-sm md:text-lg font-medium uppercase tracking-[0.3em] hover:bg-black hover:text-white transition-all duration-300"
                  >
                    {buttonText}
                  </Link>
                </div>
              </div>
            </AnimateOnScroll>
          );
        })}
      </div>
    </section>
  );
}
