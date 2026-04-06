import { Link } from "@/i18n/navigation";
import { HeaderNav } from "./header-nav";
import { MobileMenu } from "./mobile-menu";
import { CartIcon } from "./cart-icon";
import { UserIcon } from "./user-icon";
import { GlobalSearch } from "./global-search";
import { LanguageSwitcher } from "./language-switcher";

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-background border-b">
      <div className="mx-auto flex h-14 md:h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <MobileMenu />
          <Link href="/" className="text-xl md:text-2xl font-bold tracking-tight">
            909
          </Link>
        </div>

        <HeaderNav />

        <div className="flex items-center gap-2 md:gap-4">
          <GlobalSearch />
          <LanguageSwitcher />
          <UserIcon />
          <CartIcon />
        </div>
      </div>
    </header>
  );
}
