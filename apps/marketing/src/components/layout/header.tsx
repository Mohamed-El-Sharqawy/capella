"use client";

import { Link } from "@/i18n/navigation";
import { HeaderNav } from "./header-nav";
import { MobileMenu } from "./mobile-menu";
import { CartIcon } from "./cart-icon";
import { UserIcon } from "./user-icon";
import { SearchOverlay } from "./search-overlay";
import { LanguageSwitcher } from "./language-switcher";
import { useHeaderScroll } from "./use-header-scroll";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { usePathname } from "next/navigation";

export function Header({ locale }: { locale: string }) {
  const isArabic = locale === "ar";
  const { isAtTop, isVisible } = useHeaderScroll();
  const pathName = usePathname();
  const path = pathName.replace("/en", "").replace("/ar", "");

  return (
    <header
      className={cn(
        "fixed left-0 right-0 z-40 transition-all duration-500 ease-in-out",
        isAtTop
          ? "bg-transparent border-b border-transparent text-white top-[33px]"
          : "bg-white border-b border-black/10 text-black shadow-md",
        !isVisible && "-translate-y-full"
      )}
      style={{ top: !isVisible ? "0px" : isAtTop ? "33px" : "0px" }}
    >
      <div className={cn(
        "mx-auto relative h-16 md:h-20 max-w-[1600px] px-4 md:px-6 flex items-center justify-between font-primary",
        isAtTop && "[text-shadow:0_1px_10px_rgba(0,0,0,0.45)]"
      )}>
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className={cn("xl:hidden transition-colors duration-500", isAtTop && (path === "") ? "text-white" : "text-black")}>
            <MobileMenu />
          </div>
          <div className={cn("hidden xl:block transition-colors duration-500", isAtTop && (path === "") ? "text-white" : "text-black")}>
            <HeaderNav />
          </div>
        </div>

        <Link href="/" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap hover:opacity-80 transition-opacity">
          <Image src={(path === "") ? "/logo_capella_light.webp" : "/logo_capella.webp"} alt="Capella's Brand Logo" width={180} height={55} className={cn("h-auto w-[140px] md:w-[180px] transition-all duration-500", !isAtTop && "brightness-0")} />
        </Link>

        <div className={cn("flex items-center justify-end gap-2 sm:gap-4 min-w-0 flex-1 transition-colors duration-500", isAtTop && (path === "") ? "text-white" : "text-black")}>
          <div className="hidden md:block">
            <SearchOverlay />
          </div>
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>
          <UserIcon />
          <CartIcon isArabic={isArabic} />
        </div>
      </div>
    </header>
  );
}
