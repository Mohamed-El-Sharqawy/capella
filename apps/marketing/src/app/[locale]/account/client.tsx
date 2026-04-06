"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useFavourites } from "@/contexts/favourites-context";
import { useWishlist } from "@/contexts/wishlist-context";
import { useOrders } from "@/contexts/orders-context";
import { useCart } from "@/contexts/cart-context";
import type { Product } from "@ecommerce/shared-types";
import type { AccountPageClientProps, Order } from "./types";
import { useAccountTabs, useAddresses, usePhoneEdit } from "./hooks";
import {
  AccountLayout,
  AccountSidebar,
  AccountPageSkeleton,
  ProfileTab,
  OrdersTab,
  FavouritesTab,
  WishlistTab,
  CartTab,
  AddressesTab,
} from "./components";

function AccountPageContent({ locale }: AccountPageClientProps) {
  const t = useTranslations("account");
  const router = useRouter();
  const isArabic = locale === "ar";

  const { user, isAuthenticated, isLoading: authLoading, signOut } = useAuth();
  const { favouriteIds, favouriteItems, removeFavourite } = useFavourites();
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { orders, isLoading: ordersLoading } = useOrders();
  const { items: cartItems } = useCart();

  const { state: tabsState, handlers: tabsHandlers } = useAccountTabs();
  const { addresses, isLoading: addressesLoading } = useAddresses();
  const phoneEdit = usePhoneEdit({ isArabic });

  const [favouriteProducts, setFavouriteProducts] = useState<Product[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [isLoadingFavourites, setIsLoadingFavourites] = useState(false);
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/signin");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const products = favouriteItems
      .filter((item) => item.product && item.product.id)
      .map((item) => item.product);
    setFavouriteProducts(products);
    setIsLoadingFavourites(false);
  }, [favouriteItems]);

  useEffect(() => {
    const products = wishlistItems
      .filter((item) => item.product && item.product.id)
      .map((item) => item.product as Product);
    setWishlistProducts(products);
    setIsLoadingWishlist(false);
  }, [wishlistItems]);

  const handleSignOut = () => {
    signOut();
    router.push("/");
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
        <p className="text-muted-foreground">
          {t("loading")}
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const tabs = [
    { id: "profile" as const, count: undefined },
    { id: "orders" as const, count: orders.meta?.total || 0 },
    { id: "favourites" as const, count: favouriteIds.length },
    { id: "wishlist" as const, count: wishlistItems.length },
    { id: "cart" as const, count: cartItems.length },
    { id: "addresses" as const, count: addresses.length },
  ];

  const greeting = `${t("greeting")}، ${user?.firstName}`;

  return (
    <AccountLayout
      greeting={greeting}
      sidebar={
        <AccountSidebar
          locale={locale}
          activeTab={tabsState.activeTab}
          onTabChange={tabsHandlers.handleTabChange}
          onSignOut={handleSignOut}
          tabs={tabs}
        />
      }
    >
      {tabsState.activeTab === "profile" && (
        <ProfileTab locale={locale} phoneEdit={phoneEdit} />
      )}

      {tabsState.activeTab === "orders" && (
        <OrdersTab
          locale={locale}
          orders={orders}
          isLoading={ordersLoading}
          page={tabsState.ordersPage}
          onPageChange={tabsHandlers.setOrdersPage}
        />
      )}

      {tabsState.activeTab === "favourites" && (
        <FavouritesTab
          locale={locale}
          products={favouriteProducts}
          isLoading={isLoadingFavourites}
          onRemove={removeFavourite}
        />
      )}

      {tabsState.activeTab === "wishlist" && (
        <WishlistTab
          locale={locale}
          products={wishlistProducts}
          isLoading={isLoadingWishlist}
          wishlistItems={wishlistItems.map((w) => ({ productId: w.productId, note: w.note }))}
          onRemove={removeFromWishlist}
        />
      )}

      {tabsState.activeTab === "cart" && (
        <CartTab locale={locale} />
      )}

      {tabsState.activeTab === "addresses" && (
        <AddressesTab
          locale={locale}
          addresses={addresses}
          isLoading={addressesLoading}
        />
      )}
    </AccountLayout>
  );
}

export function AccountPageClient(props: AccountPageClientProps) {
  return (
    <Suspense fallback={<AccountPageSkeleton />}>
      <AccountPageContent {...props} />
    </Suspense>
  );
}
