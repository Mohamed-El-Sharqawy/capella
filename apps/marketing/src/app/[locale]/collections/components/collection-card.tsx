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
      className="group block rounded-md overflow-hidden"
    >
      <div className="relative aspect-3/4 overflow-hidden bg-neutral-50 rounded-md">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={isArabic ? nameAr : nameEn}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-neutral-200 to-neutral-300" />
        )}
      </div>
      <div className="mt-3 md:mt-4 text-center">
        <h3
          className="text-xs md:text-sm font-medium text-center uppercase text-neutral-800 group-hover:text-black transition-colors"
          style={{ letterSpacing: isArabic ? "0em" : "0.1em" }}
        >
          {isArabic ? nameAr : nameEn}
        </h3>
      </div>
    </Link>
  );
}
