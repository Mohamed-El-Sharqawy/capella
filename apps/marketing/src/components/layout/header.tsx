import { Link } from "@/i18n/navigation";
import { HeaderNav } from "./header-nav";
import { MobileMenu } from "./mobile-menu";
import { CartIcon } from "./cart-icon";
import { UserIcon } from "./user-icon";
import { SearchOverlay } from "./search-overlay";
import { LanguageSwitcher } from "./language-switcher";
import Image from "next/image";

export function Header({ locale }: { locale: string }) {
  const isArabic = locale === "ar";

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="mx-auto h-16 md:h-20 max-w-8xl px-4 flex items-center justify-between">
        {/* Left: Mobile Menu / Desktop Navigation */}
        <div className="flex items-center gap-4">
          <div className="lg:hidden">
            <MobileMenu />
          </div>
          <div className="hidden lg:block">
            <HeaderNav />
          </div>
        </div>

        {/* Center: Logo */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2 text-xl sm:text-2xl md:text-3xl font-light uppercase tracking-[0.3em] whitespace-nowrap hover:opacity-80 transition-opacity">
          <Image src={"/logo_capella.webp"} alt="Capella's Brand Logo" width={200} height={200} />
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:block">
            <SearchOverlay />
          </div>
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          <UserIcon />
          <CartIcon isArabic={isArabic} />
        </div>
      </div>
    </header>
  );
}
