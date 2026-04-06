"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useState, type ReactNode } from "react";
import { AuthProvider } from "@/contexts/auth-context";
import { AuthPromptProvider } from "@/contexts/auth-prompt-context";
import { CartProvider } from "@/contexts/cart-context";
import { FavouritesProvider } from "@/contexts/favourites-context";
import { WishlistProvider } from "@/contexts/wishlist-context";
import { OrdersProvider } from "@/contexts/orders-context";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <AuthProvider>
          <AuthPromptProvider>
            <FavouritesProvider>
              <WishlistProvider>
                <OrdersProvider>
                  <CartProvider>{children}</CartProvider>
                </OrdersProvider>
              </WishlistProvider>
            </FavouritesProvider>
          </AuthPromptProvider>
        </AuthProvider>
      </NuqsAdapter>
    </QueryClientProvider>
  );
}
