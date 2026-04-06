import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import {
  AnimateOnScroll,
} from "@/components/ui";
import { FeaturedProducts } from "@/components/sections/featured-products";
import { PromoBanner } from "@/components/sections/promo-banner";
import { ShoppableVideos } from "@/components/sections/shoppable-videos";
import { InstagramGallery } from "@/components/sections/instagram-gallery";
import { HeroBanner } from "@/components/sections/hero-banner";
import { HeroCollections } from "@/components/sections/hero-collections";
import { Features } from "@/components/sections";
import { getFeaturedProducts, getShoppableVideos, getInstagramPosts, getBanners, getFeaturedHomeCollections } from "@/lib/api";
import { generatePageMetadata, STATIC_PAGE_METADATA } from "@/lib/metadata";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const isArabic = locale === "ar";
  const content = isArabic ? STATIC_PAGE_METADATA.home.ar : STATIC_PAGE_METADATA.home.en;

  return generatePageMetadata({
    title: content.title,
    description: content.description,
    locale,
    path: "",
  });
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);


  const [featuredProducts, shoppableVideos, instagramPosts, banners, heroCollections] = await Promise.all([
    getFeaturedProducts(),
    getShoppableVideos(),
    getInstagramPosts(),
    getBanners(),
    getFeaturedHomeCollections(),
  ]);

  return (
    <div className="overflow-hidden bg-white">
      {/* Hero Banner Carousel */}
      {banners.length > 0 && (
        <HeroBanner banners={banners} locale={locale} />
      )}

      {/* Primary Collections Grid */}
      <HeroCollections collections={heroCollections} locale={locale} />

      {/* Featured Products Slider */}
      <AnimateOnScroll direction="up">
        <FeaturedProducts locale={locale} products={featuredProducts} />
      </AnimateOnScroll>

      {/* Shoppable Content / Promotional Banner */}
      <AnimateOnScroll direction="up">
        <PromoBanner locale={locale} />
      </AnimateOnScroll>

      {/* Video Commerce */}
      <AnimateOnScroll direction="up">
        <ShoppableVideos videos={shoppableVideos} locale={locale} />
      </AnimateOnScroll>

      {/* Lifestyle / Social Proof */}
      <div className="py-24 md:py-40 bg-neutral-50/50">
        <AnimateOnScroll direction="up">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-2xl md:text-3xl font-light uppercase tracking-[0.25em]">
              {locale === "ar" ? "تابعنا على انستغرام" : "Follow Us"}
            </h2>
            <div className="w-16 h-px bg-black/20 mx-auto" />
            <p className="text-xs md:text-sm uppercase tracking-widest text-muted-foreground font-light">@capella_luxury</p>
          </div>
        </AnimateOnScroll>
        <AnimateOnScroll direction="up" delay={0.1}>
          <InstagramGallery posts={instagramPosts} locale={locale} />
        </AnimateOnScroll>
      </div>

      {/* Trust Elements */}
      <div className="border-t border-gray-100 py-24 md:py-32">
        <AnimateOnScroll direction="up">
          <Features locale={locale} />
        </AnimateOnScroll>
      </div>
    </div>
  );
}
