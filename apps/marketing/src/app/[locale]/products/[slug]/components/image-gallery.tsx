"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

  const nextImage = () => {
    onSelectIndex((selectedIndex + 1) % images.length);
  };

  const prevImage = () => {
    onSelectIndex((selectedIndex - 1 + images.length) % images.length);
  };

  return (
    <div className="flex gap-4">
      {/* Thumbnails */}
      <div className="hidden md:flex flex-col gap-2 w-20">
        {images.map((img, idx) => (
          <button
            key={img.id}
            onClick={() => onSelectIndex(idx)}
            className={`relative aspect-square border-2 rounded overflow-hidden ${
              selectedIndex === idx ? "border-black" : "border-transparent"
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

      {/* Main Image */}
      <div className="flex-1 relative">
        <div className="relative aspect-3/4 bg-neutral-100 rounded-lg overflow-hidden">
          {images[selectedIndex] ? (
            <Image
              src={images[selectedIndex].url}
              alt={productName}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No Image
            </div>
          )}

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
