"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "./auth-context";
import { useAuthPrompt } from "./auth-prompt-context";
import type { Product } from "@ecommerce/shared-types";
import { apiGet, apiPost, apiDelete } from "@/lib/api-client";

interface WishlistItem {
  id: string;
  productId: string;
  variantId?: string;
  note?: string;
  product?: Product;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  isLoading: boolean;
  isInWishlist: (productId: string) => boolean;
  addToWishlist: (productId: string, variantId?: string, note?: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  toggleWishlist: (productId: string, variantId?: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, getAccessToken } = useAuth();
  const { showAuthPrompt } = useAuthPrompt();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch wishlist when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setWishlistItems([]);
      return;
    }

    const fetchWishlist = async () => {
      setIsLoading(true);
      try {
        const token = getAccessToken();
        const response = await apiGet<{ data: any[] }>("/api/wishlist", { token: token || undefined });
        setWishlistItems(
          (response.data || []).map((item: any) => ({
            id: item.id,
            productId: item.productId,
            variantId: item.variantId,
            note: item.note,
            product: item.product,
          }))
        );
      } catch {
        console.error("Failed to fetch wishlist");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWishlist();
  }, [isAuthenticated, getAccessToken]);

  const isInWishlist = useCallback(
    (productId: string) => wishlistItems.some((item) => item.productId === productId),
    [wishlistItems]
  );

  const addToWishlist = useCallback(
    async (productId: string, variantId?: string, note?: string) => {
      if (!isAuthenticated) {
        showAuthPrompt("wishlist");
        return;
      }

      // Optimistic update with temp id
      const tempItem: WishlistItem = {
        id: `temp-${productId}`,
        productId,
        variantId,
        note,
      };
      setWishlistItems((prev) => [...prev, tempItem]);

      try {
        const token = getAccessToken();
        const response = await apiPost<{ data: WishlistItem }>(
          "/api/wishlist",
          { productId, variantId, note },
          { token: token || undefined }
        );
        // Replace temp item with real data
        setWishlistItems((prev) =>
          prev.map((item) =>
            item.id === `temp-${productId}`
              ? {
                  id: response.data.id,
                  productId: response.data.productId,
                  variantId: response.data.variantId,
                  note: response.data.note,
                  product: response.data.product,
                }
              : item
          )
        );
      } catch {
        // Revert on error
        setWishlistItems((prev) => prev.filter((item) => item.productId !== productId));
      }
    },
    [isAuthenticated, getAccessToken, showAuthPrompt]
  );

  const removeFromWishlist = useCallback(
    async (productId: string) => {
      if (!isAuthenticated) {
        showAuthPrompt("wishlist");
        return;
      }

      const removedItem = wishlistItems.find((item) => item.productId === productId);

      // Optimistic update
      setWishlistItems((prev) => prev.filter((item) => item.productId !== productId));

      try {
        const token = getAccessToken();
        await apiDelete(`/api/wishlist/${productId}`, { token: token || undefined });
      } catch {
        // Revert on error
        if (removedItem) {
          setWishlistItems((prev) => [...prev, removedItem]);
        }
      }
    },
    [isAuthenticated, getAccessToken, wishlistItems, showAuthPrompt]
  );

  const toggleWishlist = useCallback(
    async (productId: string, variantId?: string) => {
      if (isInWishlist(productId)) {
        await removeFromWishlist(productId);
      } else {
        await addToWishlist(productId, variantId);
      }
    },
    [isInWishlist, addToWishlist, removeFromWishlist]
  );

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        isLoading,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}
