"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { 
  Facebook, 
  Linkedin, 
  Send, 
} from "lucide-react";

// Custom X (Twitter) Icon
const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
  </svg>
);

// Custom Pinterest Icon
const PinterestIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.966 1.406-5.966s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.261 7.929-7.261 4.162 0 7.398 2.966 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.621 0 12-5.378 12-12S18.638 0 12.017 0z"></path>
  </svg>
);

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
  // Use current window location if URL is not provided
  const shareUrl = typeof window !== "undefined" ? url || window.location.href : url || "";
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
      name: "X",
      icon: <XIcon className="w-3.5 h-3.5" />,
      href: `https://x.com/share?url=${encodedUrl}`,
      aria: "X social link",
    },
    {
      name: "Pinterest",
      icon: <PinterestIcon className="w-3.5 h-3.5" />,
      href: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedImage}&description=${encodedTitle}`,
      aria: "Pinterest social link",
    },
    {
      name: "Linkedin",
      icon: <Linkedin className="w-4 h-4" strokeWidth={1.5} />,
      href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}`,
      aria: "Linkedin social link",
    },
    {
      name: "Telegram",
      icon: <Send className="w-3.5 h-3.5" strokeWidth={1.5} />,
      href: `https://telegram.me/share/url?url=${encodedUrl}`,
      aria: "Telegram social link",
    },
  ];

  if (variant === "footer") {
    return (
      <div className={cn("space-y-4", className)}>
        <h3 className="text-[10px] md:text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
          Share
        </h3>
        <div className="flex flex-wrap gap-3">
          {shareLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-800 text-gray-400 transition-all hover:bg-white hover:text-black hover:border-white shadow-sm"
              aria-label={link.aria}
            >
              {link.icon}
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-4", className)}>
       {variant === "default" && (
         <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400">
           Share:
         </span>
       )}
      <div className="flex gap-2.5">
        {shareLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className={cn(
               "flex items-center justify-center w-8 h-8 rounded-full border border-gray-100 transition-all hover:border-black hover:bg-black hover:text-white",
               variant === "minimal" && "border-none w-auto h-auto bg-transparent hover:bg-transparent hover:text-gray-400"
            )}
            aria-label={link.aria}
          >
            {link.icon}
          </a>
        ))}
      </div>
    </div>
  );
}
