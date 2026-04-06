import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import {
  InfiniteMarquee,
  AnimateOnScroll,
} from "@/components/ui";
import { FeaturedProducts } from "@/components/sections/featured-products";
import { PromoBanner } from "@/components/sections/promo-banner";
import { ShoppableVideos } from "@/components/sections/shoppable-videos";
import { InstagramGallery } from "@/components/sections/instagram-gallery";
import { HeroBanner } from "@/components/sections/hero-banner";
import { HeroCollections } from "@/components/sections/hero-collections";
import { CustomersFeedback, Features } from "@/components/sections";
import { getFeaturedProducts, getShoppableVideos, getInstagramPosts, getReviews, getBanners, getFeaturedHomeCollections } from "@/lib/api";
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
  

  const [t, featuredProducts, shoppableVideos, instagramPosts, reviews, banners, heroCollections] = await Promise.all([
    getTranslations("home"),
    getFeaturedProducts(),
    getShoppableVideos(),
    getInstagramPosts(),
    getReviews(),
    getBanners(),
    getFeaturedHomeCollections(),
  ]);

  return (
    <div className="overflow-hidden">
      {/* Hero Banner Carousel */}
      {banners.length > 0 && (
        <HeroBanner banners={banners} locale={locale} />
      )}

      <AnimateOnScroll direction="up">
        <InfiniteMarquee
          text={t("pricesStartingFrom")}
          className="border-y border-border py-3 bg-black"
          textClassName="text-sm font-semibold uppercase tracking-wider text-white"
          separator="—"
          speed="normal"
          isArabic={locale === "ar"}
        />
      </AnimateOnScroll>

      <HeroCollections collections={heroCollections} locale={locale} />

      <AnimateOnScroll direction="up">
        <FeaturedProducts locale={locale} products={featuredProducts} />
      </AnimateOnScroll>

      <AnimateOnScroll direction="left">
        <PromoBanner locale={locale} />
      </AnimateOnScroll>

      <AnimateOnScroll direction="up">
        <ShoppableVideos videos={shoppableVideos} locale={locale} />
      </AnimateOnScroll>

      <AnimateOnScroll direction="right">
        <InstagramGallery posts={instagramPosts} locale={locale} />
      </AnimateOnScroll>

      <AnimateOnScroll direction="up">
        <CustomersFeedback reviews={reviews} locale={locale} />
      </AnimateOnScroll>

      <AnimateOnScroll direction="up">
        <Features locale={locale} />
      </AnimateOnScroll>
    </div>
  );
}
