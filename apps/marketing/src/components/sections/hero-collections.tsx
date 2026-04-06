"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { AnimateOnScroll } from "@/components/ui";

interface Collection {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  image?: { url: string } | null;
}

interface HeroCollectionsProps {
  collections: Collection[];
  locale: string;
}

export function HeroCollections({ collections, locale }: HeroCollectionsProps) {
  const isArabic = locale === "ar";

  if (collections.length === 0) return null;

  return (
    <section className="bg-white pb-1 md:pb-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-2">
        {collections.slice(0, 3).map((collection, index) => (
          <AnimateOnScroll
            key={collection.id}
            direction="up"
            delay={index * 0.1}
          >
            <Link
              href={`/collections/${collection.slug}`}
              className="group relative block aspect-3/4 overflow-hidden"
            >
              <Image
                src={collection.image?.url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=800&fit=crop"}
                alt={isArabic ? collection.nameAr : collection.nameEn}
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              {/* Overlay with text at bottom */}
              <div className="absolute inset-x-0 bottom-0 py-10 md:py-16 flex flex-col items-center justify-end bg-linear-to-t from-black/50 via-transparent to-transparent text-white">
                <h3 className="text-[10px] md:text-xs font-medium uppercase tracking-[0.4em] transition-transform duration-700 group-hover:-translate-y-2">
                  {isArabic ? collection.nameAr : collection.nameEn}
                </h3>
              </div>
            </Link>
          </AnimateOnScroll>
        ))}
      </div>
    </section>
  );
}
