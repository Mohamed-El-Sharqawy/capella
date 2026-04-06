"use client";

import { useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@ecommerce/shared-types";
import { ProductCardWithVariants } from "./product-card-with-variants";

interface ProductSliderProps {
  products: Product[];
  locale: string;
}

export function ProductSlider({ products, locale }: ProductSliderProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isRtl = locale === "ar";
  const itemsPerPage = 4;
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const minSwipeDistance = 50;

  const scrollToPage = useCallback(
    (page: number) => {
      if (scrollRef.current) {
        const containerWidth = scrollRef.current.clientWidth;
        const gap = 24; // md:gap-6 = 24px
        const pageWidth = containerWidth + gap;
        const scrollPosition = pageWidth * page;

        scrollRef.current.scrollTo({
          left: isRtl ? -scrollPosition : scrollPosition,
          behavior: "smooth",
        });
        setCurrentPage(page);
      }
    },
    [isRtl]
  );

  const handlePrev = () => {
    const newPage = Math.max(0, currentPage - 1);
    scrollToPage(newPage);
  };

  const handleNext = () => {
    const newPage = Math.min(totalPages - 1, currentPage + 1);
    scrollToPage(newPage);
  };

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchEndX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchStartX - touchEndX;
    const isSwipeLeft = swipeDistance > minSwipeDistance;
    const isSwipeRight = swipeDistance < -minSwipeDistance;

    if (isRtl) {
      if (isSwipeRight && currentPage < totalPages - 1) {
        handleNext();
      } else if (isSwipeLeft && currentPage > 0) {
        handlePrev();
      }
    } else {
      if (isSwipeLeft && currentPage < totalPages - 1) {
        handleNext();
      } else if (isSwipeRight && currentPage > 0) {
        handlePrev();
      }
    }
  };

  // Mouse swipe handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only track if clicking on the container, not on product cards
    if ((e.target as HTMLElement).closest('a, button')) return;
    setTouchStartX(e.clientX);
    setTouchEndX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (touchStartX === 0) return;
    setTouchEndX(e.clientX);
  };

  const handleMouseUp = () => {
    if (touchStartX === 0) return;
    
    const swipeDistance = touchStartX - touchEndX;
    const isSwipeLeft = swipeDistance > minSwipeDistance;
    const isSwipeRight = swipeDistance < -minSwipeDistance;

    if (isRtl) {
      if (isSwipeRight && currentPage < totalPages - 1) {
        handleNext();
      } else if (isSwipeLeft && currentPage > 0) {
        handlePrev();
      }
    } else {
      if (isSwipeLeft && currentPage < totalPages - 1) {
        handleNext();
      } else if (isSwipeRight && currentPage > 0) {
        handlePrev();
      }
    }

    setTouchStartX(0);
    setTouchEndX(0);
  };

  const handleMouseLeave = () => {
    setTouchStartX(0);
    setTouchEndX(0);
  };

  return (
    <div className="relative" dir={isRtl ? "rtl" : "ltr"}>
      {/* Navigation Arrows - Desktop */}
      <button
        onClick={isRtl ? handleNext : handlePrev}
        className="absolute -left-4 top-1/3 z-10 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isRtl ? currentPage === totalPages - 1 : currentPage === 0}
        aria-label="Previous"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        onClick={isRtl ? handlePrev : handleNext}
        className="absolute -right-4 top-1/3 z-10 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isRtl ? currentPage === 0 : currentPage === totalPages - 1}
        aria-label="Next"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Products Grid */}
      <div
        ref={scrollRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className="flex gap-4 md:gap-6 overflow-hidden pb-4"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="shrink-0 w-[calc(50%-8px)] sm:w-[calc(33.333%-12px)] md:w-[calc(25%-18px)]"
          >
            <ProductCardWithVariants product={product} locale={locale} />
          </div>
        ))}
      </div>

      {/* Pagination Dots */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToPage(index)}
              className={`h-2 w-2 rounded-full transition-colors ${
                currentPage === index ? "bg-primary" : "bg-gray-300"
              }`}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
