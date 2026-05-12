"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { ShoppableVideo, Product } from "@ecommerce/shared-types";
import { Play, Eye } from "lucide-react";
import { QuickViewModal } from "@/components/ui/quick-view-modal";
import { useTranslations } from "next-intl";

interface ShoppableVideosProps {
  videos: ShoppableVideo[];
  locale: string;
}

export function ShoppableVideos({ videos, locale }: ShoppableVideosProps) {
  if (videos.length === 0) return null;
  const isArabic = locale === "ar";
  const t = useTranslations("product");

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
      <div>
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-2xl md:text-3xl font-light uppercase" style={{ letterSpacing: isArabic ? "0em" : "0.25em" }}>
            {t("shoppableVideos")}
          </h2>
          <div className="w-16 h-px bg-black/20 mx-auto" />
          <p className="text-xs md:text-sm uppercase text-muted-foreground" style={{ letterSpacing: isArabic ? "0em" : "0.1em" }}>
            {t("shoppableVideosDesc")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12">
          {videos.slice(0, 3).map((video) => (
            <div key={video.id} className="max-w-[16rem] md:max-w-none mx-auto w-full">
              <ShoppableVideoCard video={video} locale={locale} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ShoppableVideoCard({
  video,
  locale,
}: {
  video: ShoppableVideo;
  locale: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const isArabic = locale === "ar";

  const product = video.product;
  const variant = product?.variants?.[0];
  const imageUrl = variant?.images?.[0]?.image?.url;
  const productName = locale === "ar" ? product?.nameEn : product?.nameEn;
  const material = locale === "ar" ? product?.material?.nameAr : product?.material?.nameEn;
  const price = variant?.price ?? 0;
  const compareAtPrice = variant?.compareAtPrice;

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => { });
      setIsPlaying(true);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (!isPlaying && videoRef.current) {
      videoRef.current.play().catch(() => { });
      setIsPlaying(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return (
    <div className="group">
      {/* Video/Thumbnail */}
      <div
        className="relative aspect-3/4 rounded-lg overflow-hidden bg-muted cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={togglePlay}
      >
        {/* Thumbnail */}
        <Image
          src={video.thumbnailUrl}
          alt={productName || "Shoppable video"}
          fill
          className={`object-cover transition-opacity duration-300 ${isPlaying ? "opacity-0" : "opacity-100"}`}
        />

        {/* Video */}
        <video
          ref={videoRef}
          src={video.videoUrl}
          muted
          loop
          playsInline
          preload="auto"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isPlaying ? "opacity-100" : "opacity-0"}`}
        />

        {/* Play icon overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Play className="h-6 w-6 text-black ml-1" fill="currentColor" />
            </div>
          </div>
        )}
      </div>

      {/* Product info */}
      {product && (
        <div className="flex items-center gap-4 mt-6">
          <Link
            href={`/products/${product.slug}`}
            className="flex items-center gap-4 flex-1 min-w-0 hover:opacity-100 group/link transition-opacity"
          >
            {imageUrl && (
              <div className="relative w-14 h-14 bg-neutral-50 rounded-sm overflow-hidden border border-gray-100 shrink-0">
                <Image
                  src={imageUrl}
                  alt={productName || "Product"}
                  fill
                  className="object-cover transition-transform duration-700 group-hover/link:scale-110"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium uppercase truncate group-hover/link:opacity-60 transition-opacity" style={{ letterSpacing: isArabic ? "0em" : "0.1em" }}>{productName}</p>
              {material && (
                <p className="text-xs text-muted-foreground mt-0.5" style={{ letterSpacing: isArabic ? "0em" : "0.05em" }}>{material}</p>
              )}
              <div className="flex items-center gap-1.5 mt-1">
                {compareAtPrice && compareAtPrice > price && (
                  <span className="text-xs text-muted-foreground line-through" style={{ letterSpacing: isArabic ? "0em" : "0.05em" }}>
                    {compareAtPrice.toLocaleString()}
                  </span>
                )}
                <span className="text-sm font-semibold text-foreground" style={{ letterSpacing: isArabic ? "0em" : "0.025em" }}>
                  AED {price.toLocaleString()}
                </span>
              </div>
            </div>
          </Link>
          <button
            onClick={() => setShowQuickView(true)}
            className="h-10 w-10 flex items-center justify-center rounded-full border border-gray-200 hover:bg-black hover:text-white transition-all duration-300 group/btn"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Quick View Modal */}
      {product && (
        <QuickViewModal
          product={product as unknown as Product}
          locale={locale}
          isOpen={showQuickView}
          onClose={() => setShowQuickView(false)}
        />
      )}
    </div>
  );
}
