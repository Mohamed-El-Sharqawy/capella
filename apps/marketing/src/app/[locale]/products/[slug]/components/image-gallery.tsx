"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface ProductImage {
  id: string;
  url: string;
  altEn?: string | null;
  altAr?: string | null;
}

interface ImageGalleryProps {
  images: ProductImage[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  productName: string;
  locale: string;
}

export function ImageGallery({
  images,
  selectedIndex,
  onSelectIndex,
  productName,
  locale,
}: ImageGalleryProps) {
  const isArabic = locale === "ar";
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isDragStart, setIsDragStart] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);

  const nextImage = () => {
    onSelectIndex((selectedIndex + 1) % images.length);
  };

  const prevImage = () => {
    onSelectIndex((selectedIndex - 1 + images.length) % images.length);
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (Math.abs(diff) > 50) {
      if (diff > 0) isArabic ? prevImage() : nextImage();
      else isArabic ? nextImage() : prevImage();
    }
    setTouchStart(null);
  };

  // Mouse handlers for desktop gestures
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragStart(true);
    setDragStartX(e.clientX);
    e.preventDefault(); // Prevent text selection
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragStart) return;
    // We only trigger on MouseUp to avoid accidental skips during slight moves
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragStart) return;
    const diff = dragStartX - e.clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) isArabic ? prevImage() : nextImage();
      else isArabic ? nextImage() : prevImage();
    }
    setIsDragStart(false);
  };

  const handleMouseLeave = () => {
    setIsDragStart(false);
  };

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-6">
      {/* Thumbnails - Desktop Side */}
      <div className="hidden lg:flex flex-col gap-3 w-20">
        {images.map((img, idx) => (
          <button
            key={img.id}
            onClick={() => onSelectIndex(idx)}
            className={`relative aspect-3/4 border transition-all duration-300 ${selectedIndex === idx ? "border-black brightness-100" : "border-gray-100 brightness-90 hover:brightness-100"
              }`}
          >
            <Image
              src={img.url}
              alt={isArabic ? img.altAr || productName : img.altEn || productName}
              fill
              className="object-cover"
              sizes="80px"
            />
          </button>
        ))}
      </div>

      {/* Main Image Viewport */}
      <div className="flex-1 relative group">
        <div
          className={`relative aspect-3/4 overflow-hidden ${images.length > 1 ? "cursor-grab active:cursor-grabbing" : ""}`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {images.length > 0 ? (
            images.map((img, idx) => (
              <div
                key={img.id}
                className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${selectedIndex === idx ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                  }`}
              >
                <Image
                  src={img.url}
                  alt={isArabic ? img.altAr || productName : img.altEn || productName}
                  fill
                  className="object-cover p-4 md:p-8"
                  sizes="(max-width: 1024px) 100vw, 800px"
                  priority={true}
                />
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-gray-300 font-light uppercase tracking-widest text-xs">
              Preview Not Available
            </div>
          )}

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={isArabic ? nextImage : prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/40 hover:bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 invisible group-hover:visible"
              >
                <ChevronLeft className="h-5 w-5 text-gray-800" />
              </button>
              <button
                onClick={isArabic ? prevImage : nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/40 hover:bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 invisible group-hover:visible"
              >
                <ChevronRight className="h-5 w-5 text-gray-800" />
              </button>
            </>
          )}

          {/* Pagination Dots - Mobile/Small Devices */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 lg:hidden">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => onSelectIndex(idx)}
                className={`h-1 rounded-full transition-all duration-300 ${selectedIndex === idx ? "w-6 bg-black" : "w-2 bg-gray-300"
                  }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
