"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Banner } from "@ecommerce/shared-types";

interface HeroBannerProps {
  banners: Banner[];
  locale: string;
}

export function HeroBanner({ banners, locale }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isArabic = locale === "ar";

  const activeBanners = banners.filter((b) => b.isActive);

  // Reset auto-play timer - clears existing timeout and sets a new one
  const resetAutoPlayTimer = useCallback(() => {
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
    setIsAutoPlaying(false);
    resumeTimeoutRef.current = setTimeout(() => setIsAutoPlaying(true), 5000);
  }, []);

  const goToNext = useCallback(() => {
    if (activeBanners.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  }, [activeBanners.length]);

  const goToPrev = useCallback(() => {
    if (activeBanners.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  }, [activeBanners.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    resetAutoPlayTimer();
  };

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying || activeBanners.length <= 1) return;

    const interval = setInterval(goToNext, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, goToNext, activeBanners.length]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
      }
    };
  }, []);

  if (activeBanners.length === 0) {
    return null;
  }

  const currentBanner = activeBanners[currentIndex];
  const title = isArabic ? currentBanner.titleAr : currentBanner.titleEn;
  const subtitle = isArabic ? currentBanner.subtitleAr : currentBanner.subtitleEn;
  const buttonText = isArabic ? currentBanner.buttonTextAr : currentBanner.buttonTextEn;

  return (
    <section className="relative w-full h-svh overflow-hidden bg-black">
      {/* Banner Images */}
      {activeBanners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={banner.imageUrl}
            alt={isArabic ? banner.titleAr : banner.titleEn}
            fill
            loading="eager"
            priority={index === 0}
            className="object-cover"
            sizes="100vw"
          />
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/30" />
        </div>
      ))}

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
        {subtitle && (
          <p className="text-sm md:text-base uppercase tracking-widest mb-2 opacity-90">
            {subtitle}
          </p>
        )}
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-light uppercase tracking-wider mb-6">
          {title}
        </h1>
        {buttonText && currentBanner.linkUrl && (
          <Link
            href={currentBanner.linkUrl}
            className="px-8 py-3 bg-white text-black text-sm font-medium uppercase tracking-wider hover:bg-white/90 transition"
          >
            {buttonText}
          </Link>
        )}
      </div>

      {/* Navigation Arrows */}
      {activeBanners.length > 1 && (
        <>
          <button
            onClick={() => {
              goToPrev();
              resetAutoPlayTimer();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white transition z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            onClick={() => {
              goToNext();
              resetAutoPlayTimer();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white transition z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {activeBanners.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
          {activeBanners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full border-2 border-white transition ${
                index === currentIndex ? "bg-white" : "bg-transparent"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
