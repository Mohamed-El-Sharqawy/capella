"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { ShoppableVideo, Product } from "@ecommerce/shared-types";
import { Play, Eye } from "lucide-react";
import { QuickViewModal } from "@/components/ui/quick-view-modal";

interface ShoppableVideosProps {
  videos: ShoppableVideo[];
  locale: string;
}

export function ShoppableVideos({ videos, locale }: ShoppableVideosProps) {
  if (videos.length === 0) return null;

  return (
    <section className="py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Shoppable Videos</h2>
          <p className="text-muted-foreground">See it. Move in it. Shop it.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {videos.slice(0, 3).map((video) => (
            <ShoppableVideoCard key={video.id} video={video} locale={locale} />
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

  const product = video.product;
  const variant = product?.variants?.[0];
  const imageUrl = variant?.images?.[0]?.image?.url;
  const productName = locale === "ar" ? product?.nameAr : product?.nameEn;
  const price = variant?.price ?? 0;
  const compareAtPrice = variant?.compareAtPrice;

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
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
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isPlaying ? "opacity-100" : "opacity-0"}`}
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
        <div className="flex items-center gap-3 mt-3 p-2 rounded-lg">
          <Link
            href={`/products/${product.slug}`}
            className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
          >
            {imageUrl && (
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                <Image
                  src={imageUrl}
                  alt={productName || "Product"}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{productName}</p>
              <div className="flex items-center gap-2">
                {compareAtPrice && compareAtPrice > price && (
                  <span className="text-xs text-muted-foreground line-through">
                    LE {compareAtPrice.toFixed(2)}
                  </span>
                )}
                <span className="text-sm font-semibold text-primary">
                  LE {price.toFixed(2)}
                </span>
              </div>
            </div>
          </Link>
          <button
            onClick={() => setShowQuickView(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black text-white text-xs font-medium hover:bg-black/80 transition-colors shrink-0"
          >
            <Eye className="h-3.5 w-3.5" />
            Quick View
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
