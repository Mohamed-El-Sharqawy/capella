"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface CollectionCardProps {
  title: string;
  href: string;
  imageUrl: string;
  imageAlt?: string;
}

export function CollectionCard({
  title,
  href,
  imageUrl,
  imageAlt,
}: CollectionCardProps) {
  const t = useTranslations("common");

  return (
    <Link
      href={href}
      className="group relative block overflow-hidden w-full sm:w-[340px] md:w-[500px] lg:w-[705px] aspect-705/1010"
    >
      <Image
        src={imageUrl}
        alt={imageAlt || title}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 640px) 100vw, (max-width: 768px) 340px, (max-width: 1024px) 500px, 705px"
        priority
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute bottom-8 md:bottom-12 left-0 right-0 text-center text-white">
        <h2 className="text-2xl md:text-4xl font-bold tracking-wide">{title}</h2>
        <p className="mt-2 text-xs md:text-sm font-medium tracking-wider">{t("shopNow")}</p>
      </div>
    </Link>
  );
}
