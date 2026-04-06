"use client";

import Image from "next/image";
import Link from "next/link";
import type { InstagramPost } from "@ecommerce/shared-types";

interface InstagramGalleryProps {
  posts: InstagramPost[];
  locale: string;
}

export function InstagramGallery({ posts, locale }: InstagramGalleryProps) {
  if (posts.length === 0) return null;

  // Take up to 8 posts
  const displayPosts = posts.slice(0, 8);

  return (
    <section className="py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight">909 — FW25 Drops</h2>
          <p className="text-muted-foreground">@909</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {displayPosts.map((post) => (
            <InstagramPostCard key={post.id} post={post} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );
}

function InstagramPostCard({
  post,
  locale,
}: {
  post: InstagramPost;
  locale: string;
}) {
  const altText = locale === "ar" ? post.altAr : post.altEn;

  const content = (
    <div className="relative aspect-square overflow-hidden rounded-sm group cursor-pointer">
      <Image
        src={post.imageUrl}
        alt={altText || "909 FW25"}
        fill
        className="object-cover transition-all duration-500 group-hover:scale-105"
      />
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
    </div>
  );

  if (post.linkUrl) {
    return (
      <Link href={post.linkUrl} target={post.linkUrl.startsWith("http") ? "_blank" : undefined}>
        {content}
      </Link>
    );
  }

  return content;
}
