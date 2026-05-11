"use client";

import { cn } from "@/lib/utils";

interface InfiniteMarqueeProps {
  text: React.ReactNode;
  className?: string;
  textClassName?: string;
  separator?: string;
  speed?: "slow" | "normal" | "fast";
  isArabic?: boolean;
}

export function InfiniteMarquee({
  text,
  className,
  textClassName,
  separator = "—",
  speed = "normal",
  isArabic = false,
}: InfiniteMarqueeProps) {
  const speedClass = {
    slow: "animate-marquee-slow",
    normal: "animate-marquee",
    fast: "animate-marquee-fast",
  }[speed];

  const items = Array(20).fill(null);

  return (
    <div className={cn("overflow-hidden", className)}>
      <div className={cn("flex", speedClass)} dir="ltr">
        {/* GROUP 1 */}
        <div className="flex shrink-0">
          {items.map((_, i) => (
            <span
              key={i}
              className={cn("mx-4 shrink-0 whitespace-nowrap", textClassName)}
              dir={isArabic ? "rtl" : "ltr"}
            >
              {text} {separator}
            </span>
          ))}
        </div>

        {/* GROUP 2 (duplicate) */}
        <div className="flex shrink-0">
          {items.map((_, i) => (
            <span
              key={`dup-${i}`}
              className={cn("mx-4 shrink-0 whitespace-nowrap", textClassName)}
              dir={isArabic ? "rtl" : "ltr"}
            >
              {text} {separator}
            </span>
          ))}
        </div>
      </div>
    </div >
  );
}
