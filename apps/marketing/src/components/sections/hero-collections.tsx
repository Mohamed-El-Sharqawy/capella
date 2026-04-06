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
    <section className="py-12 md:py-16">
      {/* Section Title */}
      <div className="text-center mb-8">
        <h2 className="text-xl md:text-2xl font-medium tracking-wide">
          {isArabic ? "مجموعة جديدة" : "New Collection"}
        </h2>
        <div className="w-12 h-0.5 bg-gray-400 mx-auto mt-3" />
      </div>

      {/* Collections Grid */}
      <div className="max-w-5xl mx-auto px-4">
        {/* Top Row - 2 larger cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {collections.slice(0, 2).map((collection, index) => (
            <AnimateOnScroll
              key={collection.id}
              direction="up"
              delay={index * 0.1}
            >
              <Link
                href={`/collections/${collection.slug}`}
                className="group relative block overflow-hidden aspect-4/3 rounded-lg"
              >
                <Image
                  src={collection.image?.url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=450&fit=crop"}
                  alt={isArabic ? collection.nameAr : collection.nameEn}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="text-white text-xl md:text-2xl font-light italic tracking-wide">
                    {isArabic ? collection.nameAr : collection.nameEn}
                  </h3>
                </div>
              </Link>
            </AnimateOnScroll>
          ))}
        </div>

        {/* Bottom Row - 3 smaller cards */}
        {collections.length > 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {collections.slice(2, 5).map((collection, index) => (
              <AnimateOnScroll
                key={collection.id}
                direction="up"
                delay={(index + 2) * 0.1}
              >
                <Link
                  href={`/collections/${collection.slug}`}
                  className="group relative block overflow-hidden aspect-4/5 rounded-lg"
                >
                  <Image
                    src={collection.image?.url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=500&fit=crop"}
                    alt={isArabic ? collection.nameAr : collection.nameEn}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <h3 className="text-white text-lg md:text-xl font-light italic tracking-wide">
                      {isArabic ? collection.nameAr : collection.nameEn}
                    </h3>
                  </div>
                </Link>
              </AnimateOnScroll>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
