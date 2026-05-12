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
  homeFeaturedPosition?: number;
}

interface HeroCollectionsProps {
  collections: Collection[];
  locale: string;
}

/**
* Collections grid — 2 per row on all screen sizes.
*
* ┌──────┬──────┐
* │  A   │  B   │
* ├──────┼──────┤
* │  C   │  D   │
* └──────┴──────┘
*/
export function HeroCollections({ collections, locale }: HeroCollectionsProps) {
  const isArabic = locale === "ar";

  if (collections.length === 0) return null;

  const displayCollections = collections.slice(0, 4);

  return (
    <section className="bg-white pb-8 md:pb-12 pt-3 px-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 md:gap-2.5">
        {displayCollections.map((collection, index) => (
          <AnimateOnScroll
            key={collection.id}
            direction="up"
            delay={index * 0.08}
          >
            <Link
              href={`/collections/${collection.slug}`}
              className="group relative block w-full overflow-hidden rounded-md aspect-3/4 md:aspect-4/5"
            >
              {/* Image */}
              <Image
                src={
                  collection.image?.url ||
                  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=1000&fit=crop"
                }
                alt={isArabic ? collection.nameAr : collection.nameEn}
                fill
                className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, 50vw"
              />

              {/* Dark gradient overlay — stronger on hover */}
              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/15 to-transparent transition-colors duration-700 group-hover:from-black/70 group-hover:via-black/25" />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-3 md:pb-3 text-white">
                {/* Decorative line */}

                <h3 className="text-sm md:text-base font-light uppercase transition-all duration-700 group-hover:-translate-y-1" style={{ letterSpacing: isArabic ? "0em" : "0.2em" }}>
                  {isArabic ? collection.nameAr : collection.nameEn}
                </h3>

                {/* <span className="block w-6 h-px bg-white/60 mt-3 transition-all duration-700 group-hover:w-10 group-hover:bg-white/90" /> */}
              </div>
            </Link>
          </AnimateOnScroll>
        ))}
      </div>
    </section>
  );
}
