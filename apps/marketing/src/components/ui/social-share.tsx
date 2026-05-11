"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Facebook,
  Instagram,
} from "lucide-react";
import Link from "next/link";

interface SocialShareProps {
  url?: string;
  title?: string;
  image?: string;
  className?: string;
  variant?: "default" | "minimal" | "footer";
}

export function SocialShare({
  url,
  title,
  image,
  className,
  variant = "default",
}: SocialShareProps) {
  const [shareUrl, setShareUrl] = useState(url || "");

  useEffect(() => {
    if (!url && typeof window !== "undefined") {
      setShareUrl(window.location.href);
    }
  }, [url]);

  const shareTitle = title || "";
  const shareImage = image || "";

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(shareTitle);
  const encodedImage = encodeURIComponent(shareImage);

  const shareLinks = [
    {
      name: "Facebook",
      icon: <Facebook className="w-4 h-4" strokeWidth={1.5} />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      aria: "Facebook social link",
    },
    {
      name: "Instagram",
      icon: <Instagram className="w-3.5 h-3.5" />,
      href: `https://www.instagram.com/capella.uae/`,
      aria: "Instagram social link",
    },
  ];

  if (variant === "footer") {
    return (
      <div className={cn("space-y-4", className)}>
        <h3 className="text-xs md:text-sm font-medium uppercase tracking-[0.2em] text-gray-400">
          Share
        </h3>
        <div className="flex flex-wrap gap-3">
          {shareLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex items-center justify-center w-11 h-11 rounded-full border border-gray-800 text-gray-400 transition-all hover:bg-white hover:text-black hover:border-white shadow-sm cursor-pointer"
              aria-label={link.aria}
            >
              {link.icon}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {variant === "default" && (
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
          Share:
        </span>
      )}
      <div className="flex gap-2.5">
        {shareLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className={cn(
              "flex items-center justify-center w-11 h-11 rounded-full border border-gray-100 transition-all hover:border-black hover:bg-black hover:text-white cursor-pointer",
              variant === "minimal" && "border-none w-auto h-auto bg-transparent hover:bg-transparent hover:text-gray-400"
            )}
            aria-label={link.aria}
          >
            {link.icon}
          </Link>
        ))}
      </div>
    </div>
  );
}
