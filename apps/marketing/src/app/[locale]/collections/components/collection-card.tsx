"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";

interface CollectionCardProps {
  slug: string;
  nameEn: string;
  nameAr: string;
  imageUrl?: string | null;
  locale: string;
}

export function CollectionCard({ slug, nameEn, nameAr, imageUrl, locale }: CollectionCardProps) {
  const isArabic = locale === "ar";

  return (
    <Link
      href={`/collections/${slug}`}
      className="group relative aspect-3/4 overflow-hidden bg-neutral-100"
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={isArabic ? nameAr : nameEn}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-linear-to-br from-gray-200 to-gray-300" />
      )}
      <div className="absolute inset-0 bg-black/30 transition-opacity group-hover:bg-black/40" />
      <div className="absolute inset-0 flex items-center justify-center">
        <h2 className="text-white text-2xl font-bold tracking-wide text-center px-4">
          {isArabic ? nameAr : nameEn}
        </h2>
      </div>
    </Link>
  );
}
