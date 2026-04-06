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

interface FavouriteItem {
  id: string;
  productId: string;
  product: Product;
}

interface FavouritesContextType {
  favouriteIds: string[];
  favouriteItems: FavouriteItem[];
  isLoading: boolean;
  isFavourite: (productId: string) => boolean;
  addFavourite: (productId: string) => Promise<void>;
  removeFavourite: (productId: string) => Promise<void>;
  toggleFavourite: (productId: string) => Promise<void>;
}

const FavouritesContext = createContext<FavouritesContextType | undefined>(undefined);

export function useFavourites() {
  const context = useContext(FavouritesContext);
  if (context === undefined) {
    throw new Error("useFavourites must be used within a FavouritesProvider");
  }
  return context;
}

export function FavouritesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, getAccessToken } = useAuth();
  const { showAuthPrompt } = useAuthPrompt();
  const [favouriteItems, setFavouriteItems] = useState<FavouriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Derive IDs from items
  const favouriteIds = favouriteItems.map((item) => item.productId);

  // Fetch favourites when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setFavouriteItems([]);
      return;
    }

    const fetchFavourites = async () => {
      setIsLoading(true);
      try {
        const token = getAccessToken();
        const data = await apiGet<{ data: any[] }>("/api/favourites", { token: token || undefined });
        const items = (data.data || []).map((f: any) => ({
          id: f.id,
          productId: f.productId,
          product: f.product,
        }));
        setFavouriteItems(items);
      } catch {
        console.error("Failed to fetch favourites");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavourites();
  }, [isAuthenticated, getAccessToken]);

  const isFavourite = useCallback(
    (productId: string) => favouriteIds.includes(productId),
    [favouriteIds]
  );

  const addFavourite = useCallback(
    async (productId: string) => {
      console.log("addFavourite called, isAuthenticated:", isAuthenticated);
      if (!isAuthenticated) {
        console.log("User not authenticated, showing auth prompt");
        showAuthPrompt("favourites");
        return;
      }

      // Optimistic update - add placeholder item
      const tempItem: FavouriteItem = {
        id: `temp-${productId}`,
        productId,
        product: {} as Product,
      };
      setFavouriteItems((prev) => [...prev, tempItem]);

      try {
        const token = getAccessToken();
        const data = await apiPost<{ data: { id: string; productId: string; product: Product } }>(
          "/api/favourites",
          { productId },
          { token: token || undefined }
        );
        // Replace temp item with real data
        setFavouriteItems((prev) =>
          prev.map((item) =>
            item.id === `temp-${productId}`
              ? { id: data.data.id, productId: data.data.productId, product: data.data.product }
              : item
          )
        );
      } catch {
        // Revert on error
        setFavouriteItems((prev) => prev.filter((item) => item.productId !== productId));
      }
    },
    [isAuthenticated, getAccessToken, showAuthPrompt]
  );

  const removeFavourite = useCallback(
    async (productId: string) => {
      if (!isAuthenticated) {
        showAuthPrompt("favourites");
        return;
      }

      // Store for revert
      const removedItem = favouriteItems.find((item) => item.productId === productId);

      // Optimistic update
      setFavouriteItems((prev) => prev.filter((item) => item.productId !== productId));

      try {
        const token = getAccessToken();
        await apiDelete(`/api/favourites/${productId}`, { token: token || undefined });
      } catch {
        // Revert on error
        if (removedItem) {
          setFavouriteItems((prev) => [...prev, removedItem]);
        }
      }
    },
    [isAuthenticated, getAccessToken, favouriteItems, showAuthPrompt]
  );

  const toggleFavourite = useCallback(
    async (productId: string) => {
      if (isFavourite(productId)) {
        await removeFavourite(productId);
      } else {
        await addFavourite(productId);
      }
    },
    [isFavourite, addFavourite, removeFavourite]
  );

  return (
    <FavouritesContext.Provider
      value={{
        favouriteIds,
        favouriteItems,
        isLoading,
        isFavourite,
        addFavourite,
        removeFavourite,
        toggleFavourite,
      }}
    >
      {children}
    </FavouritesContext.Provider>
  );
}
