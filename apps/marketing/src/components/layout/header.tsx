import { Link } from "@/i18n/navigation";
import { HeaderNav } from "./header-nav";
import { MobileMenu } from "./mobile-menu";
import { CartIcon } from "./cart-icon";
import { UserIcon } from "./user-icon";
import { SearchOverlay } from "./search-overlay";
import { LanguageSwitcher } from "./language-switcher";

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="mx-auto h-16 md:h-20 max-w-7xl px-4 grid grid-cols-3 items-center">
        {/* Left: Mobile Menu / Desktop Navigation */}
        <div className="flex items-center justify-start gap-4 h-full">
          <div className="lg:hidden">
            <MobileMenu />
          </div>
          <div className="hidden lg:block">
            <HeaderNav />
          </div>
        </div>

        {/* Center: Logo */}
        <div className="flex items-center justify-center h-full">
          <Link href="/" className="text-xl sm:text-2xl md:text-3xl font-light uppercase tracking-[0.3em] whitespace-nowrap hover:opacity-80 transition-opacity">
            capella
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-3 md:gap-6 h-full">
          <div className="hidden sm:block">
            <SearchOverlay />
          </div>
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          <UserIcon />
          <CartIcon />
        </div>
      </div>
    </header>
  );
}
